import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CategoryDTO } from './category.dto';
import { CategoryService } from './category.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('financial-category')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('create')
  async creteCategory(@Body() body: CategoryDTO) {
    const result = await this.categoryService.createCategory(body);

    return result;
  }

  @Get('list')
  async listCategories(
    @Query('painel_id', new ParseArrayPipe({ items: Number, separator: ',' }))
    painelIds: number[],
  ) {
    return this.categoryService.listCategories(painelIds);
  }

  @Delete('delete/:id')
  async deleteCategory(@Param('id') id: number) {
    const result = await this.categoryService.deleteCategory(id);

    return result;
  }

  @Patch('update/:id')
  async updateCategory(
    @Param('id') id: number,
    @Body() body: Partial<CategoryDTO>,
  ) {
    const result = await this.categoryService.editCategory(id, body);

    return result;
  }
}
