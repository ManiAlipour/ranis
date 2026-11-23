import Banner from "../../models/Banner";
import Category from "../../models/Category";
import Comment from "../../models/Comment";
import Contact from "../../models/Contact";
import Order from "../../models/Order";
import Product from "../../models/Product";
import Transaction from "../../models/Transaction";
import User from "../../models/User";
import Controller from "../../utils/baseController";
import type { Request, Response } from "express";

const dashboardController = new (class extends Controller {
  async summary(_req: Request, res: Response) {
    const [
      users,
      activeProducts,
      activeCategories,
      activeBanners,
      pendingOrders,
      newContacts,
      pendingComments,
      pendingTransactions,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ status: "active" }),
      Category.countDocuments({ isActive: true }),
      Banner.countDocuments({ isActive: true }),
      Order.countDocuments({ status: "pending" }),
      Contact.countDocuments({ status: "new" }),
      Comment.countDocuments({ status: "pending" }),
      Transaction.countDocuments({ status: "pending" }),
    ]);
    return this.response({
      res,
      data: {
        users,
        activeProducts,
        activeCategories,
        activeBanners,
        pendingOrders,
        newContacts,
        pendingComments,
        pendingTransactions,
      },
    });
  }
})();

export default dashboardController;
