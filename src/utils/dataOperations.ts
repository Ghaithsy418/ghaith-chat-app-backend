import { Request } from "express";
import { Model, Query } from "mongoose";
import AppError from "./appError.js";

type MongooseQuery<T> = Query<T[], T>;

export default class DataOperations<T> {
  private reqQuery: Request["query"];
  public mongooseQuery: MongooseQuery<T>;

  private model: Model<T>;

  constructor(
    reqQuery: Request["query"],
    mongooseQuery: MongooseQuery<T>,
    model: Model<T>
  ) {
    this.reqQuery = reqQuery;
    this.mongooseQuery = mongooseQuery;
    this.model = model;
  }

  public filter(): this {
    const queryObj = { ...this.reqQuery };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(lt|lte|gte|gt)\b/g, (match) => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    return this;
  }

  public sort(): this {
    const sortQuery = this.reqQuery.sort;
    let sortStr: string;

    if (sortQuery) {
      sortStr = String(sortQuery).split(",").join(" ");
    } else {
      sortStr = "-createdAt";
    }

    this.mongooseQuery = this.mongooseQuery.sort(sortStr);

    return this;
  }

  public selectFields(): this {
    const fieldsQuery = this.reqQuery.fields;
    let fieldsStr: string;

    if (fieldsQuery) {
      fieldsStr = String(fieldsQuery).split(",").join(" ");
    } else {
      fieldsStr = "-__v";
    }

    this.mongooseQuery = this.mongooseQuery.select(fieldsStr);

    return this;
  }

  public async paginate() {
    const pageNum = Number(this.reqQuery.page) || 1;
    const limitNum = Number(this.reqQuery.limit) || Infinity;

    const totalNumber = await this.model.countDocuments(
      this.mongooseQuery.getQuery()
    );

    const skipValue = (pageNum - 1) * limitNum;

    if (skipValue >= totalNumber && pageNum > 1) {
      throw new AppError("No more content", 404);
    }

    this.mongooseQuery = this.mongooseQuery.skip(skipValue).limit(limitNum);

    return {
      page: pageNum,
      limit: limitNum,
      paginationOutput: {
        totalNumber,
        currentItems: `from ${skipValue + 1} to ${Math.min(
          skipValue + limitNum,
          totalNumber
        )}`,
        prevPage: pageNum > 1 ? pageNum - 1 : "None",
        currentPage: pageNum,
        nextPage: skipValue + limitNum < totalNumber ? pageNum + 1 : "None",
      },
    };
  }
}
