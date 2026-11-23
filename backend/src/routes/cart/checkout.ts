import Address from "../../models/Address";
import Cart from "../../models/Cart";
import Order from "../../models/Order";
import Product from "../../models/Product";
import User from "../../models/User";
import Variant from "../../models/Variant";
import Controller from "../../utils/baseController";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

const checkoutController = new (class extends Controller {
  async create(req: Request, res: Response) {
    const user = res.locals.authUser as InstanceType<typeof User>;
    const { addressId, customerNote } = req.body as {
      addressId: string;
      customerNote?: string;
    };
    if (!user.address.some((id) => id.toString() === addressId)) {
      return this.error(404, "نشانی پیدا نشد.");
    }
    const [address, cart] = await Promise.all([
      Address.findById(addressId),
      Cart.findOne({ user: user._id } as never),
    ]);
    if (!address) return this.error(404, "نشانی پیدا نشد.");
    if (!cart?.items.length) return this.error(409, "سبد خرید خالی است.");

    const orderItems = [];
    const reserved: Array<{ variantId: unknown; quantity: number }> = [];
    let subtotal = 0;
    let orderCreated = false;
    try {
      for (const cartItem of cart.items) {
        const variantId = cartItem.variant.toString();
        const variant = await Variant.findById(variantId);
        if (!variant || !variant.isActive) {
          return this.error(409, "یکی از محصولات سبد خرید دیگر در دسترس نیست.");
        }
        const product = await Product.findOne({
          _id: variant.product,
          status: "active",
        });
        if (!product)
          return this.error(409, "یکی از محصولات سبد خرید دیگر در دسترس نیست.");

        const stockUpdate = await Variant.updateOne(
          {
            _id: variant._id,
            isActive: true,
            stock: { $gte: cartItem.quantity },
          },
          { $inc: { stock: -cartItem.quantity } },
        );
        if (stockUpdate.modifiedCount !== 1) {
          return this.error(
            409,
            "موجودی یکی از محصولات برای ثبت این تعداد کافی نیست.",
          );
        }
        reserved.push({ variantId: variant._id, quantity: cartItem.quantity });
        subtotal += variant.price * cartItem.quantity;
        orderItems.push({
          product: product._id,
          variant: variant._id,
          productName: product.name,
          sku: variant.sku,
          imageUrl: product.images[0],
          attributes: variant.attributes,
          quantity: cartItem.quantity,
          unitPrice: variant.price,
        });
      }

      const [order] = await Order.create([
        {
          orderNumber: `RN-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
          user: user._id,
          items: orderItems,
          shippingAddress: {
            recipientFirstName: address.recipientFirstName,
            recipientLastName: address.recipientLastName,
            phoneNumber: address.phoneNumber,
            province: address.province,
            city: address.city,
            addressLine: address.addressLine,
            postalCode: address.postalCode,
            plaque: address.plaque,
            unit: address.unit,
          },
          subtotal,
          shippingCost: 0,
          discount: 0,
          total: subtotal,
          currency: "IRR",
          status: "pending",
          customerNote,
        },
      ]);
      orderCreated = true;

      await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } });
      return this.response({
        res,
        status: 201,
        message: "سفارش با موفقیت ثبت شد.",
        data: order,
      });
    } catch (error) {
      if (!orderCreated) {
        await Promise.all(
          reserved.map(({ variantId, quantity }) =>
            Variant.updateOne(
              { _id: variantId },
              { $inc: { stock: quantity } },
            ),
          ),
        );
      }
      throw error;
    }
  }
})();

export default checkoutController;
