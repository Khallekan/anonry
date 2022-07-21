import { ResponseData } from "../common/types";
import { Response } from "express";

class ResponseStatus {
  statusCode: number | null;

  success: boolean | null;

  data: ResponseData | null;

  message: string | null;

  constructor() {
    this.statusCode = null;
    this.success = null;
    this.data = null;
    this.message = null;
  }

  setSuccess(
    statusCode: number,
    data: ResponseData | null,
    message: string | null
  ): this {
    this.statusCode = statusCode;
    this.data = data;
    this.success = true;
    this.message = message;
    return this;
  }

  setError(statusCode: number, message: string): this {
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    return this;
  }

  send(res: Response): Response {
    const result: {
      success: boolean | null;
      data: ResponseData | null;
      message?: string;
    } = {
      success: this.success,
      data: this.data,
    };
    if (this.message) result.message = this.message;
    if (this.success) {
      return res.status(this.statusCode ? this.statusCode : 200).json(result);
    }

    return res.status(this.statusCode ? this.statusCode : 500).json({
      success: this.success,
      message: this.message,
      data: [],
    });
  }
}
export default ResponseStatus;