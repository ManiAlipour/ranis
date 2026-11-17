import Cart from "@models/Cart";
import Product from "@models/Product";
import User from "@models/User";
import Variant from "@models/Variant";
import Controller from "@utils/baseController";
import type { Request, Response } from "express";

const getUser = (res: Response) =>
  res.locals.authUser as InstanceType<typeof User>;
type CartEntry = { variant: { toString(): string }; quantity: number };
type CartDataItem = {
  available: boolean;
  quantity: number;
  lineTotal: number | null;
};

const cartController = new (class extends Controller {
  private async getCartData(userId: unknown) {
    const cart = (await Cart.findOne({ user: userId } as never).populate({
      path: "items.variant",
      populate: { path: "product", select: "name slug images status" },
    })) as any;

    const items: CartDataItem[] = ((cart?.items ?? []) as CartEntry[]).map(
      (item) => {
        const variant = item.variant as unknown as {
          _id: { toString(): string };
          sku: string;
          attributes: Map<string, string>;
          price: number;
          compareAtPrice?: number;
          stock: number;
          isActive: boolean;
          product?: {
            name: string;
            slug: string;
            images: string[];
            status: string;
          } | null;
        };
        const available = Boolean(
          variant?._id &&
          variant.isActive &&
          variant.product?.status === "active",
        );
        return {
          variantId: variant?._id?.toString() ?? null,
          sku: variant?.sku ?? null,
          attributes: variant?.attributes ?? {},
          price: variant?.price ?? null,
          compareAtPrice: variant?.compareAtPrice ?? null,
          quantity: item.quantity,
          stock: variant?.stock ?? 0,
          available,
          product: variant?.product ?? null,
          lineTotal: available ? variant.price * item.quantity : null,
        };
      },
    );
    const availableItems = items.filter((item) => item.available);
    return {
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: availableItems.reduce(
        (total, item) => total + (item.lineTotal ?? 0),
        0,
      ),
    };
  }

  async get(_req: Request, res: Response) {
    return this.response({
      res,
      data: await this.getCartData(getUser(res)._id),
    });
  }

  async addItem(req: Request, res: Response) {
    const user = getUser(res);
    const { variantId, quantity } = req.body as {
      variantId: string;
      quantity: number;
    };
    const variant = await Variant.findById(variantId);
    if (!variant || !variant.isActive)
      return this.error(404, "تنوع محصول پیدا نشد.");
    const product = await Product.findOne({
      _id: variant.product,
      status: "active",
    });
    if (!product) return this.error(404, "محصول در دسترس نیست.");

    const cart = (await Cart.findOneAndUpdate(
      { user: user._id } as never,
      { $setOnInsert: { user: user._id, items: [] } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )) as any;
    const item = cart.items.find(
      (entry: CartEntry) => entry.variant.toString() === variantId,
    );
    const nextQuantity = (item?.quantity ?? 0) + quantity;
    if (nextQuantity > variant.stock)
      return this.error(409, "تعداد درخواستی بیشتر از موجودی انبار است.");
    if (item) item.quantity = nextQuantity;
    else cart.items.push({ variant: variant._id, quantity });
    await cart.save();
    return this.response({
      res,
      status: 201,
      message: "محصول به سبد خرید اضافه شد.",
      data: await this.getCartData(user._id),
    });
  }

  async updateItem(req: Request, res: Response) {
    const user = getUser(res);
    const { variantId } = req.params as { variantId: string };
    const { quantity } = req.body as { quantity: number };
    const variant = await Variant.findById(variantId);
    if (
      !variant ||
      !variant.isActive ||
      !(await Product.exists({ _id: variant.product, status: "active" }))
    ) {
      return this.error(404, "تنوع محصول در دسترس نیست.");
    }
    if (quantity > variant.stock)
      return this.error(409, "تعداد درخواستی بیشتر از موجودی انبار است.");
    const cart = (await Cart.findOne({ user: user._id } as never)) as any;
    const item = cart?.items.find(
      (entry: CartEntry) => entry.variant.toString() === variantId,
    );
    if (!cart || !item) return this.error(404, "این محصول در سبد خرید نیست.");
    item.quantity = quantity;
    await cart.save();
    return this.response({
      res,
      message: "تعداد محصول به‌روزرسانی شد.",
      data: await this.getCartData(user._id),
    });
  }

  async removeItem(req: Request, res: Response) {
    const user = getUser(res);
    const { variantId } = req.params as { variantId: string };
    const cart = (await Cart.findOne({ user: user._id } as never)) as any;
    if (
      !cart ||
      !cart.items.some(
        (item: CartEntry) => item.variant.toString() === variantId,
      )
    ) {
      return this.error(404, "این محصول در سبد خرید نیست.");
    }
    cart.items = cart.items.filter(
      (item: CartEntry) => item.variant.toString() !== variantId,
    );
    await cart.save();
    return this.response({
      res,
      message: "محصول از سبد خرید حذف شد.",
      data: await this.getCartData(user._id),
    });
  }

  async clear(_req: Request, res: Response) {
    const user = getUser(res);
    await Cart.updateOne({ user: user._id } as never, { $set: { items: [] } });
    return this.response({
      res,
      message: "سبد خرید خالی شد.",
      data: await this.getCartData(user._id),
    });
  }
})();

export default cartController;
