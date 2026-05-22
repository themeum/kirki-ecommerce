import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { Provider } from "react-redux";
import { store } from "@/store";
import Init from "@/Init";
import ToastController from "@/floatingComponents/ToastController";
import { router } from "@/routes";

const App = () => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  return (
    <Provider store={store}>
      <Init>
        <ToastController />
        <RouterProvider router={router} />
      </Init>
    </Provider>
  );
};

export default App;

function resetActiveMenu(root) {
  const activeMenus = root.querySelectorAll("& > ul > li.current");

  for (const menu of [...activeMenus]) {
    menu.classList.remove("current");
  }
}

function getLeadingRouteHash(hash) {
  const hashParts = hash.split("/");
  return hashParts.slice(0, 2).join("/");
}

function checkActiveSubmenu(root) {
  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has("page") && searchParams.get("page") === "ecommerce") {
    const hash = getLeadingRouteHash(window.location.hash || "#");

    const currentUrl = `admin.php?page=ecommerce${hash}`;
    const menuItems = [...root.querySelectorAll("& > ul > li")];

    for (const menuItem of menuItems) {
      const link = menuItem.querySelector("& > a")?.getAttribute("href");
      if (link === currentUrl) {
        menuItem.classList.add("current");
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ecommerceAdminMenu = document.getElementById("toplevel_page_ecommerce");
  if (!ecommerceAdminMenu) {
    return;
  }

  resetActiveMenu(ecommerceAdminMenu);
  checkActiveSubmenu(ecommerceAdminMenu);

  const menuItems = [
    ...ecommerceAdminMenu.querySelectorAll(
      "& > ul > li:not(:has(.gf-menu-separator))"
    ),
  ];

  for (const menuItem of menuItems) {
    menuItem.addEventListener("click", (event) => {
      event.preventDefault();
      const url = event.target.closest("a")?.getAttribute("href");
      resetActiveMenu(ecommerceAdminMenu);
      menuItem.classList.add("current");
      if (url) {
        if (event.metaKey || event.ctrlKey) {
          window.open(url, "_blank");
        } else {
          window.location.href = url;
        }
      }
    });
  }
});

window.addEventListener("popstate", () => {
  const ecommerceAdminMenu = document.getElementById("toplevel_page_ecommerce");
  if (!ecommerceAdminMenu) {
    return;
  }

  resetActiveMenu(ecommerceAdminMenu);
  checkActiveSubmenu(ecommerceAdminMenu);
});
