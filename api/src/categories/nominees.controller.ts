import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { Roles } from '../auth/auth.decorators';
import { Role } from '../generated/prisma/client';
import { CategoriesService } from './categories.service';
import { UpdateNomineeImageDto } from './dto/update-nominee-image.dto';

// Edição dos indicados: somente admin
@Roles(Role.ADMIN)
@Controller('nominees')
export class NomineesController {
  constructor(private readonly categories: CategoriesService) {}

  /** Define ou remove a imagem de um indicado (e, opcionalmente, dos homônimos). */
  @Patch(':id/image')
  updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNomineeImageDto,
  ) {
    return this.categories.updateNomineeImage(id, dto.imageUrl, {
      applyToSameName: dto.applyToSameName ?? false,
    });
  }
}
