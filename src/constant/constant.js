export const MEDTHOD = {
  GET: "get",
  POST: "post",
  PATCH: "patch",
  DELETE: "delete",
  PUT: "put",
};

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

export const LAYOUT = {
  ALOND: "alond",
  CHILD: "child",
};

const project_key = "6dfcf9ed-d930-11ee-9f0b-0242ac150002"; //

export const STORE_KEY = {
  authen : `${project_key}-authen`,
  current : `${project_key}-current`
}