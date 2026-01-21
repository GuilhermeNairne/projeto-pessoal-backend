import { HttpException, Injectable } from '@nestjs/common';
import { CategoryDTO } from './category.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async createCategory(body: CategoryDTO) {
    try {
      //   const result = await this.prismaService.categories.create({ data: body });
      //   return result
    } catch (error) {
      throw new HttpException(
        error.response ?? 'Erro ao criar categoria',
        error.status ?? 500,
      );
    }
  }
}
