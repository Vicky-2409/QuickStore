import Joi from "joi";

export const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.object({
          _id: Joi.string().required(),
          name: Joi.string().required(),
          price: Joi.number().required(),
          imageUrl: Joi.string().optional(),
        }).required(),
        quantity: Joi.number().min(1).required(),
      })
    )
    .required(),
  total: Joi.number().min(0).required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  userEmail: Joi.string().email().required(),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "accepted",
      "assigned",
      "picked_up",
      "on_the_way",
      "delivered"
    )
    .required(),
});
