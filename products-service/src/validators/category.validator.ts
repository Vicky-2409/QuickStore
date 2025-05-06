import { body } from "express-validator";

export const createCategoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("active")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        return value === "true" || value === "false";
      }
      return typeof value === "boolean";
    })
    .withMessage("Active status must be a boolean"),
];

export const updateCategoryValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("imageUrl").optional().isURL().withMessage("Invalid image URL format"),

  body("active")
    .optional()
    .isBoolean()
    .withMessage("Active status must be a boolean"),
];
