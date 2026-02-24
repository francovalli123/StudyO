import json
import random
import secrets
import smtplib
import socket
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.utils import timezone


def get_client_ip(request) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return (request.META.get("REMOTE_ADDR") or "unknown").strip() or "unknown"


def _signup_rate_limit_window_seconds() -> int:
    return int(getattr(settings, "SIGNUP_RATE_LIMIT_WINDOW_SECONDS", 3600))


def _signup_max_per_ip() -> int:
    return int(getattr(settings, "SIGNUP_MAX_PER_IP_PER_HOUR", 3))


def is_signup_rate_limited(client_ip: str) -> bool:
    key = f"signup:ip:{client_ip}"
    now_ts = timezone.now().timestamp()
    window = _signup_rate_limit_window_seconds()
    max_allowed = _signup_max_per_ip()

    timestamps = cache.get(key) or []
    recent = [t for t in timestamps if now_ts - float(t) < window]
    cache.set(key, recent, timeout=window)
    return len(recent) >= max_allowed


def register_signup_for_ip(client_ip: str) -> None:
    key = f"signup:ip:{client_ip}"
    now_ts = timezone.now().timestamp()
    window = _signup_rate_limit_window_seconds()

    timestamps = cache.get(key) or []
    recent = [t for t in timestamps if now_ts - float(t) < window]
    recent.append(now_ts)
    cache.set(key, recent, timeout=window)


def create_signup_captcha() -> dict:
    left = random.randint(1, 20)
    right = random.randint(1, 20)
    operation = random.choice(["+", "-"])
    expected = left + right if operation == "+" else left - right

    captcha_id = secrets.token_urlsafe(24)
    ttl_seconds = int(getattr(settings, "SIGNUP_CAPTCHA_TTL_SECONDS", 300))
    cache.set(f"signup:captcha:{captcha_id}", str(expected), timeout=ttl_seconds)

    return {
        "captcha_id": captcha_id,
        "captcha_question": f"Resuelve: {left} {operation} {right}",
        "expires_in": ttl_seconds,
    }


def verify_signup_captcha(captcha_id: str, captcha_answer: str) -> bool:
    if not captcha_id:
        return False

    cache_key = f"signup:captcha:{captcha_id}"
    expected = cache.get(cache_key)
    cache.delete(cache_key)
    if expected is None:
        return False

    return str(captcha_answer).strip() == str(expected).strip()


def _verify_email_with_abstract_api(email: str):
    api_key = (getattr(settings, "EMAIL_VERIFICATION_API_KEY", "") or "").strip()
    if not api_key:
        return None

    timeout = int(getattr(settings, "EMAIL_VERIFICATION_TIMEOUT_SECONDS", 8))
    query = urlencode({"api_key": api_key, "email": email})
    url = f"https://emailvalidation.abstractapi.com/v1/?{query}"
    request = Request(url, headers={"User-Agent": "StudyO/1.0"})

    try:
        with urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    format_ok = bool((payload.get("is_valid_format") or {}).get("value"))
    mx_ok = bool((payload.get("is_mx_found") or {}).get("value"))
    smtp_ok = bool((payload.get("is_smtp_valid") or {}).get("value"))
    deliverability = str(payload.get("deliverability", "")).upper()

    if format_ok and mx_ok and smtp_ok and deliverability == "DELIVERABLE":
        return True, None
    return False, "El correo ingresado no existe o no puede recibir emails."


def _resolve_mail_hosts(domain: str) -> list[str]:
    candidates = [domain, f"mail.{domain}", f"smtp.{domain}", f"mx.{domain}"]
    resolved = []
    for host in candidates:
        try:
            socket.getaddrinfo(host, 25)
            resolved.append(host)
        except socket.gaierror:
            continue
    return list(dict.fromkeys(resolved))


def _verify_email_with_smtp(email: str):
    timeout = int(getattr(settings, "EMAIL_VERIFICATION_TIMEOUT_SECONDS", 8))
    domain = email.split("@", 1)[1]
    mail_hosts = _resolve_mail_hosts(domain)
    if not mail_hosts:
        return False, "El dominio del correo no existe o no acepta emails."

    sender = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@studyo.app")

    for host in mail_hosts[:3]:
        try:
            smtp = smtplib.SMTP(host=host, port=25, timeout=timeout)
            smtp.ehlo_or_helo_if_needed()
            smtp.mail(sender)
            code, _ = smtp.rcpt(email)
            smtp.quit()

            if code in (250, 251):
                return True, None
            if 500 <= code < 600:
                return False, "El correo ingresado no existe."
        except (smtplib.SMTPException, socket.timeout, OSError):
            continue

    return False, "No se pudo verificar el correo. Intenta con otro email real."


def validate_registration_email_or_raise(email: str) -> None:
    try:
        validate_email(email)
    except DjangoValidationError as exc:
        raise ValueError("Formato de correo inválido.") from exc

    enabled = bool(getattr(settings, "SIGNUP_EMAIL_VERIFICATION_ENABLED", True))
    if not enabled:
        return

    api_result = _verify_email_with_abstract_api(email)
    if api_result is None:
        allow_smtp_fallback = bool(getattr(settings, "SIGNUP_EMAIL_ALLOW_SMTP_FALLBACK", False))
        if not allow_smtp_fallback:
            raise ValueError(
                "No se pudo verificar el correo en este momento. Intenta más tarde."
            )
        is_valid, message = _verify_email_with_smtp(email)
    else:
        is_valid, message = api_result

    if not is_valid:
        raise ValueError(message or "No se pudo verificar el correo.")
