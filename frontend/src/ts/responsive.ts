(() => {
  const MOBILE_SIDEBAR_OPEN_CLASS = 'is-mobile-sidebar-open';
  const DESKTOP_SIDEBAR_COLLAPSED_CLASS = 'is-desktop-sidebar-collapsed';

  const lockBodyScroll = (lock: boolean): void => {
    document.body.classList.toggle('no-scroll', lock);
  };

  const clearDesktopSidebarCollapsed = (): void => {
    document.body.classList.remove('sidebar-collapsed', DESKTOP_SIDEBAR_COLLAPSED_CLASS);
    try {
      localStorage.setItem('sidebarCollapsed', '0');
    } catch (_error) {
      // ignore storage errors
    }
  };

  if (window.innerWidth < 768) {
    clearDesktopSidebarCollapsed();
  }

  const setupTopNav = (): void => {
    const navs = Array.from(document.querySelectorAll<HTMLElement>('header nav, body > nav, .top-nav, nav'));

    navs.forEach((nav, index) => {
      const menu = nav.querySelector<HTMLElement>('.menu');
      if (!menu) return;

      nav.classList.add('has-mobile-nav');
      if (nav.querySelector('.mobile-menu-toggle')) return;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'mobile-menu-toggle';
      toggle.setAttribute('aria-label', 'Abrir menú');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span><span></span><span></span>';
      nav.appendChild(toggle);

      let overlay = document.querySelector<HTMLDivElement>(`.mobile-menu-overlay[data-nav-overlay="${index}"]`);
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.dataset.navOverlay = String(index);
        document.body.appendChild(overlay);
      }

      const closeMenu = (): void => {
        nav.classList.remove('mobile-open');
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        lockBodyScroll(document.body.classList.contains(MOBILE_SIDEBAR_OPEN_CLASS));
      };

      const openMenu = (): void => {
        document.querySelectorAll<HTMLElement>('.has-mobile-nav.mobile-open').forEach((openNav) => {
          openNav.classList.remove('mobile-open');
        });
        nav.classList.add('mobile-open');
        document.body.classList.add('nav-open');
        toggle.setAttribute('aria-expanded', 'true');
        lockBodyScroll(true);
      };

      toggle.addEventListener('click', () => {
        if (nav.classList.contains('mobile-open')) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      overlay.addEventListener('click', closeMenu);
      menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

      window.addEventListener('resize', () => {
        if (window.innerWidth > 767 && nav.classList.contains('mobile-open')) {
          closeMenu();
        }
      });
    });
  };

  const setupAppSidebar = (): void => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    document.body.classList.add('has-app-sidebar');

    let overlay = document.querySelector<HTMLDivElement>('.app-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'app-sidebar-overlay';
      document.body.appendChild(overlay);
    }

    let toggle = document.getElementById('mobileSidebarToggle') as HTMLButtonElement | null;
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'mobileSidebarToggle';
      toggle.className = 'mobile-sidebar-toggle';
      toggle.setAttribute('aria-label', 'Abrir navegación lateral');
      toggle.innerHTML = '☰';
      document.body.appendChild(toggle);
    }

    const syncSidebarLayout = (): void => {
      const mobile = window.innerWidth < 768;

      if (mobile) {
        clearDesktopSidebarCollapsed();
      } else {
        document.body.classList.remove(MOBILE_SIDEBAR_OPEN_CLASS);
      }
    };

    const closeSidebar = (): void => {
      document.body.classList.remove(MOBILE_SIDEBAR_OPEN_CLASS);
      syncSidebarLayout();
      lockBodyScroll(document.body.classList.contains('nav-open'));
    };

    const openSidebar = (): void => {
      document.body.classList.add(MOBILE_SIDEBAR_OPEN_CLASS);
      syncSidebarLayout();
      lockBodyScroll(true);
    };

    toggle.addEventListener('click', () => {
      if (document.body.classList.contains(MOBILE_SIDEBAR_OPEN_CLASS)) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay.addEventListener('click', closeSidebar);

    const handleMobileSidebarToggleClick = (event: MouseEvent): void => {
      if (window.innerWidth >= 768) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const desktopToggleHit = target.closest('#sidebarToggleBtn, [data-sidebar-toggle]');
      if (!desktopToggleHit) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (document.body.classList.contains(MOBILE_SIDEBAR_OPEN_CLASS)) {
        closeSidebar();
      } else {
        openSidebar();
      }
    };

    document.addEventListener('click', handleMobileSidebarToggleClick, true);

    document.addEventListener(
      'pointerdown',
      (event) => {
        if (window.innerWidth >= 768) return;
        if (!document.body.classList.contains(MOBILE_SIDEBAR_OPEN_CLASS)) return;
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        if (target.closest('#sidebar')) return;
        if (target.closest('#mobileSidebarToggle, #sidebarToggleBtn, [data-sidebar-toggle]')) return;
        closeSidebar();
      },
      true
    );

    const normalizeMobileCollapsedState = (): void => {
      if (window.innerWidth >= 768) return;
      clearDesktopSidebarCollapsed();
    };

    const syncDesktopCollapsedClass = (): void => {
      if (window.innerWidth < 768) return;
      const collapsed = document.body.classList.contains('sidebar-collapsed') || document.body.classList.contains(DESKTOP_SIDEBAR_COLLAPSED_CLASS);
      document.body.classList.toggle(DESKTOP_SIDEBAR_COLLAPSED_CLASS, collapsed);
      document.body.classList.remove('sidebar-collapsed');
    };

    const bodyClassObserver = new MutationObserver(() => {
      normalizeMobileCollapsedState();
      syncDesktopCollapsedClass();
    });
    bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    sidebar.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          closeSidebar();
        }
      });
    });

    sidebar.addEventListener('pointerdown', () => {
      if (window.innerWidth >= 768) return;
      if (!document.body.classList.contains(MOBILE_SIDEBAR_OPEN_CLASS)) {
        openSidebar();
      }
    });

    window.addEventListener('resize', () => {
      syncSidebarLayout();
      normalizeMobileCollapsedState();
      if (window.innerWidth > 767) {
        closeSidebar();
      }
    });

    syncSidebarLayout();
    normalizeMobileCollapsedState();
    syncDesktopCollapsedClass();
  };

  document.addEventListener('DOMContentLoaded', () => {
    setupTopNav();
    setupAppSidebar();
  });
})();
