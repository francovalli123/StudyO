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

    const applyAppShellLayout = () => {
      const mobile = window.innerWidth < 768;

      if (mobile) {
        document.body.style.display = 'block';
        document.body.style.minHeight = '100vh';
        document.body.style.height = 'auto';
        document.body.style.overflowY = 'auto';

        if (appRoot) {
          appRoot.style.width = '100%';
          appRoot.style.minWidth = '0';
          appRoot.style.flex = 'none';
          appRoot.style.overflow = 'visible';
        }

        if (appMain) {
          appMain.style.width = '100%';
          appMain.style.minWidth = '0';
        }

        const addSubjectBtn = document.getElementById('addSubjectBtn');
        if (addSubjectBtn) {
          const row = addSubjectBtn.parentElement;
          if (row) {
            row.style.flexWrap = 'wrap';
            row.style.gap = '12px';
          }
          addSubjectBtn.style.width = '100%';
          addSubjectBtn.style.justifyContent = 'center';
        }

        const plannerWrap = document.querySelector('main > .p-8.h-full.flex.gap-6');
        if (plannerWrap) {
          plannerWrap.style.flexDirection = 'column';
          plannerWrap.style.height = 'auto';
          plannerWrap.style.padding = '16px';
          plannerWrap.style.gap = '16px';
          Array.from(plannerWrap.children).forEach((child) => {
            child.style.width = '100%';
            child.style.maxWidth = 'none';
            child.style.minWidth = '0';
          });
        }
      } else {
        document.body.style.removeProperty('display');
        document.body.style.removeProperty('min-height');
        document.body.style.removeProperty('height');
        document.body.style.removeProperty('overflow-y');

        if (appRoot) {
          appRoot.style.removeProperty('width');
          appRoot.style.removeProperty('min-width');
          appRoot.style.removeProperty('flex');
          appRoot.style.removeProperty('overflow');
        }

        if (appMain) {
          appMain.style.removeProperty('width');
          appMain.style.removeProperty('min-width');
        }

        const addSubjectBtn = document.getElementById('addSubjectBtn');
        if (addSubjectBtn) {
          const row = addSubjectBtn.parentElement;
          if (row) {
            row.style.removeProperty('flex-wrap');
            row.style.removeProperty('gap');
          }
          addSubjectBtn.style.removeProperty('width');
          addSubjectBtn.style.removeProperty('justify-content');
        }

        const plannerWrap = document.querySelector('main > .p-8.h-full.flex.gap-6');
        if (plannerWrap) {
          plannerWrap.style.removeProperty('flex-direction');
          plannerWrap.style.removeProperty('height');
          plannerWrap.style.removeProperty('padding');
          plannerWrap.style.removeProperty('gap');
          Array.from(plannerWrap.children).forEach((child) => {
            child.style.removeProperty('width');
            child.style.removeProperty('max-width');
            child.style.removeProperty('min-width');
          });
        }
      }
    };

    let overlay = document.querySelector('.app-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'app-sidebar-overlay';
      document.body.appendChild(overlay);
    }

    if (!document.getElementById('mobileSidebarToggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'mobileSidebarToggle';
      toggle.className = 'mobile-sidebar-toggle';
      toggle.setAttribute('aria-label', 'Abrir navegación lateral');
      toggle.innerHTML = '☰';
      document.body.appendChild(toggle);

      const closeSidebar = () => {
        document.body.classList.remove('mobile-sidebar-open');
        lockBodyScroll(document.body.classList.contains('nav-open'));
      };

      const openSidebar = () => {
        document.body.classList.add('mobile-sidebar-open');
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
        applyAppShellLayout();
        if (window.innerWidth > 767) closeSidebar();
      });
    }

    applyAppShellLayout();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupTopNav();
    setupAppSidebar();
  });
})();
