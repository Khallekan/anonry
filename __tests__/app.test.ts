import app from "../src/app";
import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { trashCron } from "../src/trash/controllers";

beforeAll((done) => {
  done();
});

afterAll((done) => {
  // Closing the DB connection allows Jest to exit successfully.
  trashCron.stop();
  done();
});

describe("GET LANDING PAGE", () => {
  it("returns a page with the content Welcome to anonry", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toEqual(StatusCodes.OK);
  });
});
