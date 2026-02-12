(function () {
  function lockBodyScroll(lock) {
    document.body.classList.toggle('no-scroll', lock);
  }

  function setupTopNav() {
    const navs = Array.from(document.querySelectorAll('header nav, body > nav, .top-nav, nav'));
    navs.forEach((nav, index) => {
      const menu = nav.querySelector('.menu');
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

      let overlay = document.querySelector(`.mobile-menu-overlay[data-nav-overlay="${index}"]`);
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.dataset.navOverlay = String(index);
        document.body.appendChild(overlay);
      }

      const closeMenu = () => {
        nav.classList.remove('mobile-open');
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        lockBodyScroll(document.body.classList.contains('mobile-sidebar-open'));
      };

      const openMenu = () => {
        document.querySelectorAll('.has-mobile-nav.mobile-open').forEach((openNav) => {
          openNav.classList.remove('mobile-open');
        });
        nav.classList.add('mobile-open');
        document.body.classList.add('nav-open');
        toggle.setAttribute('aria-expanded', 'true');
        lockBodyScroll(true);
      };

      toggle.addEventListener('click', () => {
        if (nav.classList.contains('mobile-open')) closeMenu();
        else openMenu();
      });

      overlay.addEventListener('click', closeMenu);
      menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

      window.addEventListener('resize', () => {
        if (window.innerWidth > 767 && nav.classList.contains('mobile-open')) closeMenu();
      });
    });
  }

  function setupAppSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    document.body.classList.add('has-app-sidebar');

    const appRoot = sidebar.nextElementSibling;
    const appMain = appRoot ? appRoot.querySelector('main') : null;

    let overlay = document.querySelector('.app-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'app-sidebar-overlay';
      document.body.appendChild(overlay);
    }

    let toggle = document.getElementById('mobileSidebarToggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'mobileSidebarToggle';
      toggle.className = 'mobile-sidebar-toggle';
      toggle.setAttribute('aria-label', 'Abrir navegación lateral');
      toggle.innerHTML = '☰';
      document.body.appendChild(toggle);
    }

    const sidebarWidthValue = () => `${Math.min(Math.round(window.innerWidth * 0.84), 320)}px`;

    const applyPlannerMobileStack = (mobile) => {
      const plannerWrap = document.querySelector('main > .p-8.h-full.flex.gap-6');
      if (!plannerWrap) return;

      if (mobile) {
        plannerWrap.style.flexDirection = 'column';
        plannerWrap.style.height = 'auto';
        plannerWrap.style.padding = '16px';
        plannerWrap.style.gap = '16px';
        Array.from(plannerWrap.children).forEach((child) => {
          child.style.width = '100%';
          child.style.maxWidth = 'none';
          child.style.minWidth = '0';
          child.style.flexBasis = 'auto';
        });
      } else {
        plannerWrap.style.removeProperty('flex-direction');
        plannerWrap.style.removeProperty('height');
        plannerWrap.style.removeProperty('padding');
        plannerWrap.style.removeProperty('gap');
        Array.from(plannerWrap.children).forEach((child) => {
          child.style.removeProperty('width');
          child.style.removeProperty('max-width');
          child.style.removeProperty('min-width');
          child.style.removeProperty('flex-basis');
        });
      }
    };

    const applySubjectsMobileHeader = (mobile) => {
      const addSubjectBtn = document.getElementById('addSubjectBtn');
      if (!addSubjectBtn) return;

      const row = addSubjectBtn.parentElement;
      if (mobile) {
        if (row) {
          row.style.flexWrap = 'wrap';
          row.style.gap = '12px';
        }
        addSubjectBtn.style.width = '100%';
        addSubjectBtn.style.justifyContent = 'center';
      } else {
        if (row) {
          row.style.removeProperty('flex-wrap');
          row.style.removeProperty('gap');
        }
        addSubjectBtn.style.removeProperty('width');
        addSubjectBtn.style.removeProperty('justify-content');
      }
    };

    const syncSidebarLayout = () => {
      const mobile = window.innerWidth < 768;
      const isOpen = document.body.classList.contains('mobile-sidebar-open');

      if (mobile) {
        document.body.classList.remove('sidebar-collapsed');

        document.body.style.display = 'block';
        document.body.style.minHeight = '100vh';
        document.body.style.height = 'auto';
        document.body.style.overflowY = 'auto';

        const width = sidebarWidthValue();
        sidebar.style.position = 'fixed';
        sidebar.style.top = '0';
        sidebar.style.left = '0';
        sidebar.style.bottom = '0';
        sidebar.style.width = width;
        sidebar.style.minWidth = width;
        sidebar.style.zIndex = '1240';
        sidebar.style.transform = isOpen ? 'translateX(0)' : 'translateX(-102%)';
        sidebar.style.transition = 'transform 0.28s ease';

        if (appRoot) {
          appRoot.style.width = isOpen ? `calc(100% - ${width})` : '100%';
          appRoot.style.marginLeft = isOpen ? width : '0';
          appRoot.style.minWidth = '0';
          appRoot.style.flex = 'none';
          appRoot.style.overflow = 'visible';
          appRoot.style.transition = 'margin-left 0.28s ease, width 0.28s ease';
        }

        if (appMain) {
          appMain.style.width = '100%';
          appMain.style.minWidth = '0';
        }

        overlay.style.display = 'none';

        applyPlannerMobileStack(true);
        applySubjectsMobileHeader(true);
      } else {
        document.body.classList.remove('mobile-sidebar-open');
        document.body.style.removeProperty('display');
        document.body.style.removeProperty('min-height');
        document.body.style.removeProperty('height');
        document.body.style.removeProperty('overflow-y');

        sidebar.style.removeProperty('position');
        sidebar.style.removeProperty('top');
        sidebar.style.removeProperty('left');
        sidebar.style.removeProperty('bottom');
        sidebar.style.removeProperty('width');
        sidebar.style.removeProperty('min-width');
        sidebar.style.removeProperty('z-index');
        sidebar.style.removeProperty('transform');
        sidebar.style.removeProperty('transition');

        if (appRoot) {
          appRoot.style.removeProperty('width');
          appRoot.style.removeProperty('margin-left');
          appRoot.style.removeProperty('min-width');
          appRoot.style.removeProperty('flex');
          appRoot.style.removeProperty('overflow');
          appRoot.style.removeProperty('transition');
        }

        if (appMain) {
          appMain.style.removeProperty('width');
          appMain.style.removeProperty('min-width');
        }

        overlay.style.removeProperty('display');

        applyPlannerMobileStack(false);
        applySubjectsMobileHeader(false);
      }
    };

    const closeSidebar = () => {
      document.body.classList.remove('mobile-sidebar-open');
      syncSidebarLayout();
      lockBodyScroll(document.body.classList.contains('nav-open'));
    };

    const openSidebar = () => {
      document.body.classList.add('mobile-sidebar-open');
      syncSidebarLayout();
      lockBodyScroll(true);
    };

    toggle.addEventListener('click', () => {
      if (document.body.classList.contains('mobile-sidebar-open')) closeSidebar();
      else openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    sidebar.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) closeSidebar();
      });
    });

    window.addEventListener('resize', () => {
      syncSidebarLayout();
      if (window.innerWidth > 767) closeSidebar();
    });

    syncSidebarLayout();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupTopNav();
    setupAppSidebar();
  });
})();
