import { Persona } from '../models/Persona.js';
import { CuentaAhorros, CuentaCorriente, TarjetaCredito } from './Cuenta.js';

export class Administrador extends Persona {
    constructor(identificacion, nombreCompleto, email, celular, usuario, contrasena) {
        super(identificacion, nombreCompleto, email, celular);
        this.usuario = usuario;
        this.contrasena = contrasena;
        this.rol = "admin";
    }
}


export class Cliente extends Persona {
    constructor(identificacion, nombreCompleto, email, celular, usuario, contrasena) {
        super(identificacion, nombreCompleto, email, celular);
        this.usuario = usuario;
        this.contrasena = contrasena;
        this.intentosFallidos = 0;
        this.bloqueado = false;
        this.rol = "cliente";
        this.cuentas = [
            new CuentaAhorros(`AHORRO-${identificacion}`, 0),
            new CuentaCorriente(`CORRIENTE-${identificacion}`, 0),
            new TarjetaCredito(`TC-${identificacion}`, 1000000)
        ];
    }
}