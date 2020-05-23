import { uuid } from 'uuidv4';

import Customer from '@modules/customers/infra/typeorm/entities/Customer';

import ICreateCustomerDTO from '@modules/customers/dtos/ICreateCustomerDTO';
import ICustomersRepository from '../ICustomersRepository';

class FakeCustomerRepository implements ICustomersRepository {
  private customers: Customer[] = [];

  public async create({ name, email }: ICreateCustomerDTO): Promise<Customer> {
    const customer = new Customer();

    Object.assign(customer, { id: uuid(), name, email });

    this.customers.push(customer);

    return customer;
  }

  public async findById(id: string): Promise<Customer | undefined> {
    return this.customers.find(customer => customer.id === id);
  }

  public async findByEmail(email: string): Promise<Customer | undefined> {
    return this.customers.find(customer => customer.email === email);
  }
}

export default FakeCustomerRepository;
