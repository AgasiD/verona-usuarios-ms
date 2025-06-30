import { Usuario } from "./usuario.entity";
import { ROL_USUARIO } from "./usuarios.enum";

export class Admin extends Usuario {
    anotaciones: any[]

    constructor({ id,
        activo = true,
        anotaciones = new Array<string>(),
        apellido = '',
        chats = new Array<any>(),
        dni = '',
        email = '',
        nombre = 'Admin',
        notifications = new Array<any>(),
        novedades = new Array<any>(),
        password = '',
        profileURL = '',
        telefono = '',
        tokenDevices = new Array<string>(),
        username = '',
    }) {
        super({id, nombre, apellido, email, telefono, role: ROL_USUARIO.ADMIN, username, dni, chats, password, tokenDevices, notifications, activo, profileURL, novedades});
        this.anotaciones = anotaciones || [];
    }
}


