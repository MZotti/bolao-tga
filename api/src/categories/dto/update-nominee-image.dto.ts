import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { toTrimmed } from '../../common/normalize';

/** PATCH /api/nominees/:id/image (admin). */
export class UpdateNomineeImageDto {
  // URL https da imagem, ou null para remover.
  // Só https: o site roda em HTTPS, e o navegador bloquearia imagens http.
  @Transform(toTrimmed)
  @ValidateIf((_, value) => value !== null)
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'imageUrl deve ser um link https' },
  )
  @MaxLength(2048)
  imageUrl!: string | null;

  // true: aplica também aos indicados com o mesmo nome em outras categorias
  // (o mesmo jogo costuma concorrer em várias)
  @IsOptional()
  @IsBoolean()
  applyToSameName?: boolean;
}
