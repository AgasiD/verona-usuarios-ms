import { IsArray, IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsPhoneNumber, IsPositive, IsString, MinLength } from "class-validator";
export class CreateUsuarioDto {

    @IsString()
    @MinLength(3)
    nombre: string

    @IsString()
    @MinLength(3)
    apellido: string

    @IsString()
    @MinLength(3)
    @IsEmail()
    email: string

    @IsString()
    @MinLength(5)
    telefono: string

    @IsNumber()
    @IsPositive()
    @IsIn([1,2,3,4,5,6,7,8])
    role: number

    @IsString()
    @MinLength(3)
    dni: string
    

    @IsOptional()
    externo?: boolean
}
