import cron from "node-cron";
import Trash from "../model/trashModel";

const trashScheduler = () => {
  // run cronjob every minute
  cron.schedule("*/60 * * * * *", () => {
    const date = new Date();
    const ISODate = date.toISOString()
    const hour = date.getHours();
    const minute = date.getMinutes();
    const seconds = date.getSeconds();
    console.log(`${hour}:${minute}:${seconds}`);
  });
};

export default trashScheduler;
