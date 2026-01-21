import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { CategoryDTO } from './category.dto';
import { CategoryService } from './category.service';

@Controller('financial/category')
export class FinancialCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('create-category')
  async creteCategory(@Body() body: CategoryDTO) {
    const result = await this.categoryService.createCategory(body);
  }

  @Get('list-categories')
  async listCategories() {}

  @Delete('delete-category')
  async deleteCategory() {}

  @Patch('update-category')
  async updateCategory() {}
}
