import { Admin } from "./admin.entity";
import { Arquitecto } from "./arquitecto.entity";
import { Comprador } from "./comprador.entity";
import { Obrero } from "./obrero.entity";
import { Propietario } from "./propietario.entity";
import { Repartidor } from "./repartidor.entity";
import { Usuario } from "./usuario.entity";
import { ROL_USUARIO } from "./usuarios.enum";

export class UserFactory{

    static newUser(usuario): Usuario{
        let user_factory;
        switch (usuario.role) {
            case ROL_USUARIO.ADMIN:
              user_factory = new Admin(usuario);
              break;
            case ROL_USUARIO.PM:
              user_factory = new Arquitecto(usuario);
              break;
            case ROL_USUARIO.PROPIETARIO:
              user_factory = new Propietario(usuario);
              break;
            case ROL_USUARIO.CONTRATISTA:
              user_factory = new Obrero(usuario);
              break;
            case ROL_USUARIO.COMPRADOR:
              user_factory = new Comprador(usuario);
              break;
            case ROL_USUARIO.DELIVERY:
              user_factory = new Repartidor(usuario);
              break;
            case ROL_USUARIO.ARQUITECTO:
              user_factory = new Arquitecto({ ...usuario, externo: false });
              break;
          }

          return user_factory;
    }

}