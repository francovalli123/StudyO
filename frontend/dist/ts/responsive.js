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

    if (document.getElementById('mobileSidebarToggle')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'mobileSidebarToggle';
    toggle.className = 'mobile-sidebar-toggle';
    toggle.setAttribute('aria-label', 'Abrir navegación lateral');
    toggle.innerHTML = '☰';
    document.body.appendChild(toggle);

    let overlay = document.querySelector('.app-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'app-sidebar-overlay';
      document.body.appendChild(overlay);
    }

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
      if (window.innerWidth > 767) closeSidebar();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupTopNav();
    setupAppSidebar();
  });
})();
