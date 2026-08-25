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
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('financial-category')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'Financeiro')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('create')
  async creteCategory(@Body() body: CategoryDTO, @Req() req) {
    const result = await this.categoryService.createCategory(
      body,
      req.user.id,
    );

    return result;
  }

  @Get('list')
  async listCategories(
    @Query('painel_id', new ParseArrayPipe({ items: Number, separator: ',' }))
    painelIds: number[],
    @Req() req,
  ) {
    return this.categoryService.listCategories(painelIds, req.user.id);
  }

  @Delete('delete/:id')
  async deleteCategory(@Param('id') id: number, @Req() req) {
    const result = await this.categoryService.deleteCategory(id, req.user.id);

    return result;
  }

  @Patch('update/:id')
  async updateCategory(
    @Param('id') id: number,
    @Body() body: Partial<CategoryDTO>,
    @Req() req,
  ) {
    const result = await this.categoryService.editCategory(
      id,
      body,
      req.user.id,
    );

    return result;
  }
}
