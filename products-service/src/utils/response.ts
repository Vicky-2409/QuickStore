import { Response } from "express";

export const sendSuccess = (
  res: Response,
  data: any,
  message: string = "Success",
  statusCode: number = 200
) => {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400
) => {
  res.status(statusCode).json({
    status: "fail",
    message,
  });
};

export const sendPaginatedResponse = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number,
  message: string = "Success"
) => {
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: "success",
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};
