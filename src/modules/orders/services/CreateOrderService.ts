import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('This customer does not exists');
    }

    const checkNegativeValues = products.some(product => product.quantity <= 0);

    if (checkNegativeValues) {
      throw new AppError("You can't set quantities less than one");
    }

    const productsFound = await this.productsRepository.findAllById(products);

    if (productsFound.length !== products.length) {
      throw new AppError('There are one or more products that are not found');
    }

    const isOutOfStock = productsFound.some(productSome =>
      products.some(prodSome => {
        return productSome.quantity - prodSome.quantity < 0;
      }),
    );

    if (isOutOfStock) {
      throw new AppError(
        'There are one or more products that are out of stock',
      );
    }

    const productsUpdated = await this.productsRepository.updateQuantity(
      products,
    );

    const productsMapped = productsUpdated.map(productMap => ({
      product_id: productMap.id,
      price: productMap.price,
      quantity:
        products.find(productFinder => productFinder.id === productMap.id)
          ?.quantity || 0,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: productsMapped,
    });

    return order;
  }
}

export default CreateProductService;
