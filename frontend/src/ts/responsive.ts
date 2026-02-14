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

  const readDesktopSidebarPreference = (): boolean => {
    try {
      return localStorage.getItem('sidebarCollapsed') === '1';
    } catch (_error) {
      return false;
    }
  };

  const writeDesktopSidebarPreference = (collapsed: boolean): void => {
    try {
      localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
    } catch (_error) {
      // ignore storage errors
    }
  };

  const setDesktopSidebarCollapsed = (collapsed: boolean, persist = true): void => {
    if (window.innerWidth < 768) return;
    document.body.classList.toggle(DESKTOP_SIDEBAR_COLLAPSED_CLASS, collapsed);
    document.body.classList.remove('sidebar-collapsed');
    if (persist) {
      writeDesktopSidebarPreference(collapsed);
    }
  };

  const applyDesktopSidebarPreference = (): void => {
    if (window.innerWidth < 768) return;
    setDesktopSidebarCollapsed(readDesktopSidebarPreference(), false);
  };

  if (window.innerWidth < 768) {
    clearDesktopSidebarCollapsed();
  }

  const setupTopNav = (): void => {
    const navs = Array.from(document.querySelectorAll<HTMLElement>('header nav, body > nav, .top-nav, nav'));

    navs.forEach((nav, index) => {
      const menu = nav.querySelector<HTMLElement>('.menu');
      if (!menu) return;
      const desktopCta = nav.querySelector<HTMLAnchorElement>(':scope > .btn-nav');

      nav.classList.add('has-mobile-nav');

      if (desktopCta && !menu.querySelector('.btn-nav-mobile')) {
        const mobileCta = desktopCta.cloneNode(true) as HTMLAnchorElement;
        mobileCta.classList.add('btn-nav-mobile');
        mobileCta.removeAttribute('style');
        menu.appendChild(mobileCta);
      }

      if (nav.querySelector('.mobile-menu-toggle')) return;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'mobile-menu-toggle';
      toggle.setAttribute('aria-label', 'Abrir menu');
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
    const appRoot = document.getElementById('app-root') as HTMLElement | null;
    const appMain = document.querySelector<HTMLElement>('main');
    const sidebarToggleSelector = '#sidebarToggleBtn, [data-sidebar-toggle]';

    const applyPlannerMobileStack = (mobileExpanded: boolean): void => {
      document.body.classList.toggle('planner-mobile-stack', mobileExpanded);
    };

    const applySubjectsMobileHeader = (mobileExpanded: boolean): void => {
      document.body.classList.toggle('subjects-mobile-header', mobileExpanded);
    };

    const isMobileExpanded = (): boolean => document.body.classList.contains(MOBILE_SIDEBAR_OPEN_CLASS);

    document.body.classList.add('has-app-sidebar');

    let overlay = document.querySelector<HTMLDivElement>('.app-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'app-sidebar-overlay';
      document.body.appendChild(overlay);
    }

    const isElementVisible = (el: Element | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };

    const syncModalOpenState = (): void => {
      const overlayModalOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(isElementVisible);
      const objectiveModalOpen = isElementVisible(document.getElementById('objectiveModal'));
      const pomodoroModalOpen = isElementVisible(document.getElementById('pomodoroSettingsModal'));
      const confirmModalOpen = isElementVisible(document.getElementById('confirmModal'));

      const modalOpen = overlayModalOpen || objectiveModalOpen || pomodoroModalOpen || confirmModalOpen;

      document.body.classList.toggle('has-open-modal', modalOpen);
      if (modalOpen) {
        lockBodyScroll(true);
      } else {
        lockBodyScroll(document.body.classList.contains('nav-open'));
      }
    };

    const syncSidebarLayout = (): void => {
      const mobile = window.innerWidth < 768;
      const expanded = isMobileExpanded();

      if (mobile) {
        clearDesktopSidebarCollapsed();
        applyPlannerMobileStack(expanded);
        applySubjectsMobileHeader(expanded);
      } else {
        document.body.classList.remove(MOBILE_SIDEBAR_OPEN_CLASS);
        document.body.style.removeProperty('display');
        document.body.style.removeProperty('min-height');
        document.body.style.removeProperty('height');
        document.body.style.removeProperty('overflow-y');

        sidebar.style.removeProperty('position');
        sidebar.style.removeProperty('top');
        sidebar.style.removeProperty('left');
        sidebar.style.removeProperty('bottom');
        sidebar.style.removeProperty('height');
        sidebar.style.removeProperty('width');
        sidebar.style.removeProperty('min-width');
        sidebar.style.removeProperty('max-width');
        sidebar.style.removeProperty('z-index');
        sidebar.style.removeProperty('overflow-y');
        sidebar.style.removeProperty('overflow-x');
        sidebar.style.removeProperty('transform');
        sidebar.style.removeProperty('transition');

        if (appRoot) {
          appRoot.style.removeProperty('width');
          appRoot.style.removeProperty('max-width');
          appRoot.style.removeProperty('margin-left');
          appRoot.style.removeProperty('min-width');
          appRoot.style.removeProperty('flex');
          appRoot.style.removeProperty('overflow');
          appRoot.style.removeProperty('overflow-x');
          appRoot.style.removeProperty('transition');
        }

        if (appMain) {
          appMain.style.removeProperty('width');
          appMain.style.removeProperty('max-width');
          appMain.style.removeProperty('min-width');
          appMain.style.removeProperty('overflow-x');
        }

        applyPlannerMobileStack(false);
        applySubjectsMobileHeader(false);
      }
    };

    const closeMobileSidebar = (): void => {
      document.body.classList.remove(MOBILE_SIDEBAR_OPEN_CLASS);
      syncSidebarLayout();
      lockBodyScroll(document.body.classList.contains('nav-open'));
    };

    const openMobileSidebar = (): void => {
      document.body.classList.add(MOBILE_SIDEBAR_OPEN_CLASS);
      syncSidebarLayout();
      lockBodyScroll(document.body.classList.contains('nav-open'));
    };

    const toggleDesktopSidebarCollapsed = (): void => {
      if (window.innerWidth < 768) return;
      const collapsed = document.body.classList.contains(DESKTOP_SIDEBAR_COLLAPSED_CLASS);
      setDesktopSidebarCollapsed(!collapsed);
    };

    const toggleMobileSidebarExpanded = (): void => {
      if (window.innerWidth >= 768) return;
      if (isMobileExpanded()) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    };

    overlay.addEventListener('click', closeMobileSidebar);

    const handleSidebarToggleClick = (event: MouseEvent): void => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const toggleHit = target.closest(sidebarToggleSelector);
      if (!toggleHit) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (window.innerWidth < 768) {
        toggleMobileSidebarExpanded();
      } else {
        toggleDesktopSidebarCollapsed();
      }
    };

    document.addEventListener('click', handleSidebarToggleClick, true);

    document.addEventListener(
      'pointerdown',
      (event) => {
        if (window.innerWidth >= 768) return;
        if (!isMobileExpanded()) return;
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        if (target.closest('#sidebar')) return;
        if (target.closest(sidebarToggleSelector)) return;
        closeMobileSidebar();
      },
      true
    );

    sidebar.addEventListener('pointerdown', (event) => {
      if (window.innerWidth >= 768) return;
      if (isMobileExpanded()) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest('a, button, [data-lucide], svg, i, input, select, textarea, label')) return;
      openMobileSidebar();
    });

    const normalizeMobileCollapsedState = (): void => {
      if (window.innerWidth >= 768) return;
      clearDesktopSidebarCollapsed();
    };

    const syncDesktopCollapsedClass = (): void => {
      if (window.innerWidth < 768) return;
      const collapsed = document.body.classList.contains('sidebar-collapsed') || document.body.classList.contains(DESKTOP_SIDEBAR_COLLAPSED_CLASS);
      setDesktopSidebarCollapsed(collapsed);
    };

    const bodyClassObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const classList = document.body.classList;
          const legacyCollapsed = classList.contains('sidebar-collapsed');
          if (legacyCollapsed) {
            classList.remove('sidebar-collapsed');
          }
          if (window.innerWidth >= 768 && legacyCollapsed && !classList.contains(DESKTOP_SIDEBAR_COLLAPSED_CLASS)) {
            classList.add(DESKTOP_SIDEBAR_COLLAPSED_CLASS);
            writeDesktopSidebarPreference(true);
          }
        }
      }
    });

    bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const modalObserver = new MutationObserver(() => {
      syncModalOpenState();
    });
    modalObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

    document.addEventListener(
      'click',
      () => {
        window.setTimeout(syncModalOpenState, 0);
      },
      true
    );

    sidebar.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          closeMobileSidebar();
        }
      });
    });

    window.addEventListener('resize', () => {
      syncSidebarLayout();
      normalizeMobileCollapsedState();
      if (window.innerWidth > 767) {
        closeMobileSidebar();
        applyDesktopSidebarPreference();
        syncDesktopCollapsedClass();
      } else {
        closeMobileSidebar();
      }
    });

    applyDesktopSidebarPreference();
    syncSidebarLayout();
    normalizeMobileCollapsedState();
    syncDesktopCollapsedClass();
    syncModalOpenState();
  };

  document.addEventListener('DOMContentLoaded', () => {
    setupTopNav();
    setupAppSidebar();
  });
})();

