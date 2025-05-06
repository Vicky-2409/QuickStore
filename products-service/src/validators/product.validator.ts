import { body } from "express-validator";

export const createProductValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("categoryId").isMongoId().withMessage("Invalid category ID"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),
  body("active").optional().isBoolean().withMessage("Active must be a boolean"),
  body("attributes")
    .optional()
    .isObject()
    .withMessage("Attributes must be an object"),
];

export const updateProductValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("categoryId").optional().isMongoId().withMessage("Invalid category ID"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),
  body("active").optional().isBoolean().withMessage("Active must be a boolean"),
  body("attributes")
    .optional()
    .isObject()
    .withMessage("Attributes must be an object"),
];
