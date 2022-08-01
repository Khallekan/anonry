import Tag from "../model";
import catchController from "../../utils/catchControllerAsyncs";
import ResponseStatus from "../../utils/response";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";

const resp = new ResponseStatus();

export const createTag = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const tagsArr = [
      // emotion tags
      "happy",
      "sad",
      "angry",
      "scared",
      "confused",
      "disgusted",
      "surprised",
      "calm",
      "tired",
      "bored",
      "excited",
      "sleepy",
      "lonely",
      "hungry",
      "thirsty",
      "sick",
      "annoyed",
      "curious",
      "blessed",
      "loved",
      "indifferent",
      "horny",
      // activity tags
      "running",
      "walking",
      "cycling",
      "swimming",
      "sitting",
      "standing",
      "sleeping",
      "reading",
      "writing",
      "listening",
      "watching",
      "eating",
      "drinking",
      "working",
      "studying",
      "shopping",
      "cleaning",
      "cooking",
      // location tags
      "home",
      "office",
      "school",
      "work",
      "gym",
      "park",
      "restaurant",
      "cafe",
      "bar",
      "shop",
      "hospital",
      "bank",
      "hotel",
      "airport",
      "train",
      "bus",
      "taxi",
      "car",
      "bike",
      "truck",
      "humor",
      "dark humor",
      "light humor",
    ];

    console.log("STARTING TO CREATE TAGS");
    
    await tagsArr.map(async (tag) => {
      console.log("CREATING TAG: " + tag);
      
      const tagExists = await Tag.findOne({ name: tag });
      if (tagExists) {
        return false;
      }
      await Tag.create({ name: tag });
      return true;
    });
    console.log("DONE");
    
    resp.setSuccess(StatusCodes.CREATED, null, "Tags created successfully").send(res);

    return;
  }
);
