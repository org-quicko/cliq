import { PaginatedList } from '../dtos/paginated-list.dto';

export abstract class PaginatedListConverter<T1, T2, A extends any[] = []> {

  private converter: {
    convert: (entity: T1, ...args: A) => T2;
  };

  constructor(converter: {
    convert: (entity: T1, ...args: A) => T2;
  }) {
    this.converter = converter;
  }

  convert(
    entities: Array<T1>,
    skip: number,
    take: number,
    count?: number,
    ...args: A
  ) {
    const dtos = entities.map((entity) =>
      this.converter.convert(entity, ...args)
    );

    return PaginatedList.Builder.build<T2>(dtos, skip, take, count);
  }
}