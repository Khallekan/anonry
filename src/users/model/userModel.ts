import { hash } from "bcryptjs";
import { createHash } from "crypto";
import { Schema, model } from "mongoose";
import isEmail from "validator/lib/isEmail";
import { IUser, IUserModel } from "../../common/types";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
      lowercase: true,
      validate: [isEmail, "Please specfy a valid email."],
      required: [true, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please Provide a Password"],
      minLength: 8,
      //ensure password is never returned by a query
      select: false,
    },
    user_name: {
      type: String,
      required: [true, "Please provide a user name"],
      minLength: 5,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      //unveriified is the default state a user's  account is in before he verifies his email then it becomes verified, suspended is when admn deactivates temporarily a user's account for any flouting of rules, deteled is when the user deactivates his/her account personally and he/she can reactivate it back to unverified thereby needing to verify email again. takenDown is when admin permanently deactivates a user's account
      enum: ["verified", "unverified", "suspended", "deleted", "takenDown"],
      default: "unverified",
    },
    otpToken: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.methods.createOTP = function () {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  this.otpToken = createHash("sha256").update(OTP).digest("hex");
  this.otpExpires = Date.now() + 10 * 60 * 1000;
  console.log(this.otpToken, "OTP TOKENNNN");
  console.log(this.otpExpires, "OTP EXPIRESSSS");

  return OTP;
};

userSchema.pre("save", async function (next) {
  // first use mongoose internal boolean function isModified to check if password field has been modified or not if it has not been modified then we do not need to hash, if it has then we hash
  if (!this.isModified("password")) return next();

  // use bcrypt for hasing
  // bcrypt salts each password meaning it adds a random string to a passwrd before hashing so that even 2 equal passwords dont generate the same hash

  // note this is the async hash version that returns a promise

  this.password = await hash(this.password, 12);

  next();
});

//use middleware
userSchema.pre("save", function (next) {
  // if password wasnt changed or document is new exit this middlware
  if (this.isModified("status")) {
    this.verified = this.status === "verified";
  }
  if (!this.isModified("password") || this.isNew) return next();

  next();
});

userSchema.methods.validateOTP = function (
  candidateToken: string,
  token: string,
  type: string
) {
  //compare function returns true or false that can be accessed in any file where the buyerSchema has been imported
  if (createHash("sha256").update(candidateToken).digest("hex") === token) {
    this.otpToken = undefined;

    this.otpExpires = undefined;

    if (type === "accountVerify") {
      this.status = "verified";
      this.verified = true;
    }

    return true;
  }

  return false;
};

export default model<IUser>("user", userSchema);
