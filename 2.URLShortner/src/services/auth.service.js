import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

const registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    const error = new Error("Name, Email and password is required");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("User already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("email and password is required");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("Invalid login credentials");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = bcrypt.compare(user.password, password);

  if (!isPasswordValid) {
    const error = new Error("Invalid login credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

export { registerUser, loginUser };
