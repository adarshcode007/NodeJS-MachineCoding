import { loginUser, registerUser } from "../services/auth.service.js";

const cookieOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email and password is required",
      });
    }

    const { token, user } = await registerUser({ name, email, password });

    res.cookie("token", token, cookieOption);

    return res.status(200).json({
      message: "user registered successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password is required",
      });
    }

    const { token, user } = await loginUser({ email, password });

    res.cookie("token", token, cookieOption);

    return res.status(200).json({
      message: "user logged in successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", cookieOption);

  return res.status(200).json({
    message: "user logged out successfully",
  });
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};
