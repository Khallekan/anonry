import cron from "node-cron";
import Trash from "../model/trashModel";
import Entry from "../../entries/model/entriesModel";

const trashScheduler = () => {
  // run cronjob every minute
  cron.schedule("*/60 * * * * *", async () => {
    const date = new Date();
    const ISODate = date.toISOString();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const seconds = date.getSeconds();
    console.log(`${hour}:${minute}:${seconds}`);

    try {
      console.log("STARTING TRASH GARBAGE COLLECTION");
      const trash = await Trash.find({ expiry_date: { $lte: ISODate } });
      if (!trash.length) {
        return console.log("NO GARBAGE TO BE TRASHED");
      }

      const entries = await Entry.find({
        _id: { $in: trash.map((trash) => trash.entry) },
        deleted: true,
        permanently_deleted: false,
      });
      console.log("STARTING DELETING TRASH");
      await entries.forEach(async (entry) => {
        entry.permanently_deleted = true;
        await entry.save();
      }),
        await Trash.deleteMany({
          _id: { $in: trash.map((trash) => trash._id) },
        });
      console.log("ENDING DELETING TRASH");
    } catch (error) {
      console.error("SOMETHING WENT WRONG IN CLEARING THE TRASH");
      console.error(error);
    }
  });
};

export default trashScheduler;
