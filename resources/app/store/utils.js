import { APP_API_PREFIX } from "@/conf";

export const getOptions = (
  endpoint = "/categories",
  params = {
    search: "",
    sort_by: "name",
    sort_order: "asc",
    page: 1,
    limit: 10,
  }
) => {
  const options = {
    method: "GET",
    url: APP_API_PREFIX + endpoint,
    headers: {
      "X-WP-Nonce": window.kirki_ecommerce.nonce,
    },
    params: params,
  };

  return options;
};

export const postOptions = (endpoint = "/categories", params) => {
  const options = {
    method: "POST",
    url: APP_API_PREFIX + endpoint,
    headers: {
      "content-type": "application/json",
      "X-WP-Nonce": window.kirki_ecommerce.nonce,
    },
    data: params,
  };

  return options;
};

export const putOptions = (
  endpoint = "/categories/1",
  data = { name: "Test Category", slug: "test-category", is_active: 0 }
) => {
  const options = {
    method: "PUT",
    url: APP_API_PREFIX + endpoint,
    headers: {
      "X-WP-Nonce": window.kirki_ecommerce.nonce,
    },
    data: data,
  };

  return options;
};

export const patchOptions = (
  endpoint = "/categories/1",
  data = { name: "Test Category", slug: "test-category", is_active: 0 }
) => {
  const options = {
    method: "PATCH",
    url: APP_API_PREFIX + endpoint,
    headers: {
      "X-WP-Nonce": window.kirki_ecommerce.nonce,
    },
    data: data,
  };

  return options;
};

export const deleteOptions = (endpoint = "/categories/1") => {
  const options = {
    method: "DELETE",
    url: APP_API_PREFIX + endpoint,
    headers: {
      "X-WP-Nonce": window.kirki_ecommerce.nonce,
    },
  };
  return options;
};

export const getErrorsObject = (errors) => {
  let obj = {};
  if (!errors) {
    return obj;
  }
  Object.keys(errors).forEach((key) => {
    obj[key] = errors[key][0];
  });

  return obj;
};

export const commonActions = {
  setKeyValue: (state, action) => {
    const { key, value, nestedToggler } = action.payload;
    let current = state;

    if (nestedToggler?.length) {
      nestedToggler.forEach((pathKey) => {
        current = current[pathKey];
      });
    }

    if (["search", "sort_by", "sort_order", "page"].includes(key)) {
      current.page = 1;
    }

    current[key] = value;
  },
};
