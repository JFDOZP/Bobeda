// --- CLASES ORIENTADAS A OBJETOS (POO) ---

class Persona {
    constructor(identificacion, nombreCompleto, email, celular) {
        this.identificacion = identificacion;
        this.nombreCompleto = nombreCompleto;
        this.email = email;
        this.celular = celular;
    }
}

class Administrador extends Persona {
    constructor(identificacion, nombreCompleto, email, celular, usuario, contrasena) {
        super(identificacion, nombreCompleto, email, celular);
        this.usuario = usuario;
        this.contrasena = contrasena;
        this.rol = "admin";
    }
}

class Cuenta {
    constructor(numeroCuenta, saldo = 0) {
        this.numeroCuenta = numeroCuenta;
        this.saldo = saldo;
        this.movimientos = [];
        this.activa = true;
    }

    consultarSaldo() {
        return this.saldo;
    }

    guardarDinero(monto) {
        if (typeof monto !== "number" || isNaN(monto) || monto <= 0) {
            throw new Error("El monto debe ser un número finito mayor a cero.");
        }
        if (!this.activa) throw new Error("La cuenta se encuentra inactiva.");
        this.saldo += monto;
        this.agregarMovimiento("Consignación", monto);
    }

    retirarDinero(monto) {
        if (typeof monto !== "number" || isNaN(monto) || monto <= 0) {
            throw new Error("El monto debe ser un número finito mayor a cero.");
        }
        if (!this.activa) throw new Error("La cuenta se encuentra inactiva.");
        if (monto > this.saldo) throw new Error("Fondos insuficientes.");
        this.saldo -= monto;
        this.agregarMovimiento("Retiro", monto);
    }

    agregarMovimiento(tipo, valor, origen = "-", destino = "-") {
        const fecha = new Date().toLocaleString();
        this.movimientos.unshift({ fecha, tipo, valor, origen, destino, saldoResultante: this.saldo });
    }
}

class CuentaAhorros extends Cuenta {
    constructor(numeroCuenta, saldo = 0) {
        super(numeroCuenta, saldo);
        this.tasaInteresMensual = 0.015; // 1.5% mensual
        this.fechaUltimaLiquidacion = new Date().toISOString();
    }

    liquidarIntereses() {
        const ahora = new Date();
        const ultima = new Date(this.fechaUltimaLiquidacion);
        
        // Calcular meses transcurridos aproximados
        const diffAnios = ahora.getFullYear() - ultima.getFullYear();
        const diffMeses = ahora.getMonth() - ultima.getMonth() + (diffAnios * 12);
        
        if (diffMeses <= 0) {
            throw new Error("Aún no se cumple un nuevo período mensual para liquidar intereses.");
        }

        let interesAcumulado = 0;
        let saldoTemporal = this.saldo;

        for (let i = 0; i < diffMeses; i++) {
            let interesMes = saldoTemporal * this.tasaInteresMensual;
            interesAcumulado += interesMes;
            saldoTemporal += interesMes;
        }

        if (interesAcumulado > 0) {
            this.saldo += interesAcumulado;
            this.fechaUltimaLiquidacion = ahora.toISOString();
            this.agregarMovimiento("Liquidación Intereses (1.5%)", interesAcumulado);
        }

        return interesAcumulado;
    }
}

class CuentaCorriente extends Cuenta {
    constructor(numeroCuenta, saldo = 0) {
        super(numeroCuenta, saldo);
        this.limiteSobregiroPorcentaje = 0.20; // 20%
    }

    retirarDinero(monto) {
        if (typeof monto !== "number" || isNaN(monto) || monto <= 0) {
            throw new Error("El monto debe ser un número finito mayor a cero.");
        }
        if (!this.activa) throw new Error("La cuenta se encuentra inactiva.");
        let maximoDisponible = this.saldo + (this.saldo * this.limiteSobregiroPorcentaje);
        if (monto > maximoDisponible) throw new Error("Excede el límite de sobregiro permitido (20%).");
        this.saldo -= monto;
        this.agregarMovimiento("Retiro (Sobregiro)", monto);
    }
}

class TarjetaCredito extends Cuenta {
    constructor(numeroCuenta, cupoTotal = 5000000) {
        super(numeroCuenta, 0);
        this.cupoTotal = cupoTotal;
        this.cupoDisponible = cupoTotal;
    }

    comprarACuotas(monto, cuotas) {
        if (typeof monto !== "number" || isNaN(monto) || monto <= 0) {
            throw new Error("Monto de compra inválido.");
        }
        if (monto > this.cupoDisponible) throw new Error("Cupo de crédito insuficiente.");

        let tasaMensual = 0;
        if (cuotas >= 3 && cuotas <= 6) tasaMensual = 0.019; // 1.9%
        else if (cuotas >= 7) tasaMensual = 0.023; // 2.3%

        let cuotaMensual = 0;
        if (tasaMensual === 0) {
            cuotaMensual = monto / cuotas;
        } else {
            cuotaMensual = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -cuotas));
        }

        this.cupoDisponible -= monto;
        this.agregarMovimiento(`Compra Tarjeta (${cuotas} cuotas)`, monto);
        return cuotaMensual;
    }
}

class Cliente extends Persona {
    constructor(identificacion, nombreCompleto, email, celular, usuario, contrasena) {
        super(identificacion, nombreCompleto, email, celular);
        this.usuario = usuario;
        this.contrasena = contrasena;
        this.intentosFallidos = 0;
        this.bloqueado = false;
        this.rol = "cliente";
        this.cuentas = [
            new CuentaAhorros(`AH-${identificacion}`, 100000),
            new CuentaCorriente(`CC-${identificacion}`, 200000),
            new TarjetaCredito(`TC-${identificacion}`, 3000000)
        ];
    }
}

// --- CONTROLADOR PRINCIPAL DE LA APLICACIÓN ---

class BovedaApp {
    constructor() {
        this.usuarios = [];
        this.usuarioActual = null;
        this.cargarDatos();
        this.inicializarEventos();
    }

    cargarDatos() {
        const datos = localStorage.getItem("boveda_usuarios");
        if (datos) {
            try {
                const arr = JSON.parse(datos);
                this.usuarios = arr.map(u => {
                    if (u.rol === "admin") {
                        let adm = new Administrador(u.identificacion, u.nombreCompleto, u.email, u.celular, u.usuario, u.contrasena);
                        return adm;
                    } else {
                        let cli = new Cliente(u.identificacion, u.nombreCompleto, u.email, u.celular, u.usuario, u.contrasena);
                        cli.intentosFallidos = u.intentosFallidos || 0;
                        cli.bloqueado = u.bloqueado || false;
                        cli.cuentas = u.cuentas.map(ct => {
                            let cuentaObj;
                            if (ct.numeroCuenta.startsWith("AH")) {
                                cuentaObj = new CuentaAhorros(ct.numeroCuenta, ct.saldo);
                                cuentaObj.fechaUltimaLiquidacion = ct.fechaUltimaLiquidacion || new Date().toISOString();
                            } else if (ct.numeroCuenta.startsWith("CC")) {
                                cuentaObj = new CuentaCorriente(ct.numeroCuenta, ct.saldo);
                            } else {
                                cuentaObj = new TarjetaCredito(ct.numeroCuenta, ct.cupoTotal || 3000000);
                                if (ct.cupoDisponible !== undefined) cuentaObj.cupoDisponible = ct.cupoDisponible;
                            }
                            cuentaObj.movimientos = ct.movimientos || [];
                            cuentaObj.activa = ct.activa !== undefined ? ct.activa : true;
                            return cuentaObj;
                        });
                        return cli;
                    }
                });
            } catch (e) {
                console.error("Error al analizar JSON de localStorage, reiniciando datos.", e);
                this.inicializarDatosPorDefecto();
            }
        } else {
            this.inicializarDatosPorDefecto();
        }
    }

    inicializarDatosPorDefecto() {
        this.usuarios = [
            new Administrador("000000", "Administrador Bóbeda", "admin@boveda.com", "3000000000", "admin", "admin123"),
            new Cliente("123456", "Cliente Prueba", "cliente@boveda.com", "3001234567", "cliente", "1234")
        ];
        this.guardarDatos();
    }

    guardarDatos() {
        localStorage.setItem("boveda_usuarios", JSON.stringify(this.usuarios));
    }

    mostrarVista(idVista) {
        document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
        document.getElementById(idVista).classList.remove("oculto");
    }

    mostrarAlerta(mensaje) {
        document.getElementById("alerta-texto").innerText = mensaje;
        document.getElementById("alerta-modal").classList.remove("oculto");
    }

    inicializarEventos() {
        document.getElementById("alerta-cerrar").addEventListener("click", () => {
            document.getElementById("alerta-modal").classList.add("oculto");
        });

        // Formulario Registro
        document.getElementById("form-registro").addEventListener("submit", (e) => {
            e.preventDefault();
            const id = document.getElementById("reg-id").value.trim();
            const nombre = document.getElementById("reg-nombre").value.trim();
            const email = document.getElementById("reg-email").value.trim();
            const celular = document.getElementById("reg-celular").value.trim();
            const usuario = document.getElementById("reg-usuario").value.trim();
            const pass = document.getElementById("reg-password").value;
            const passConf = document.getElementById("reg-password-confirm").value;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.mostrarAlerta("El formato de correo electrónico no es válido.");
                return;
            }

            if (pass !== passConf) {
                this.mostrarAlerta("Las contraseñas no coinciden.");
                return;
            }

            if (pass.length < 4) {
                this.mostrarAlerta("La contraseña debe tener al menos 4 caracteres.");
                return;
            }

            if (this.usuarios.some(u => u.usuario === usuario)) {
                this.mostrarAlerta("El nombre de usuario ya existe.");
                return;
            }

            if (this.usuarios.some(u => u.identificacion === id)) {
                this.mostrarAlerta("Ya existe un usuario registrado con esta identificación.");
                return;
            }

            const nuevoCliente = new Cliente(id, nombre, email, celular, usuario, pass);
            this.usuarios.push(nuevoCliente);
            this.guardarDatos();
            this.mostrarAlerta("¡Registro exitoso! Ya puede iniciar sesión.");
            this.mostrarVista("vista-login");
        });

        // Formulario Login
        document.getElementById("form-login").addEventListener("submit", (e) => {
            e.preventDefault();
            const usuarioInput = document.getElementById("login-usuario").value.trim();
            const passInput = document.getElementById("login-password").value;

            const usuarioObj = this.usuarios.find(u => u.usuario === usuarioInput);

            if (!usuarioObj) {
                this.mostrarAlerta("Usuario no encontrado.");
                return;
            }

            if (usuarioObj.rol === "cliente" && usuarioObj.bloqueado) {
                this.mostrarAlerta("Cuenta bloqueada por exceso de intentos fallidos.");
                return;
            }

            if (usuarioObj.contrasena === passInput) {
                if (usuarioObj.rol === "cliente") {
                    usuarioObj.intentosFallidos = 0;
                    this.guardarDatos();
                }
                this.usuarioActual = usuarioObj;
                this.iniciarPanelSegunRol();
            } else {
                if (usuarioObj.rol === "cliente") {
                    usuarioObj.intentosFallidos++;
                    this.guardarDatos();
                    
                    document.getElementById("intentos-info").classList.remove("oculto");
                    document.getElementById("contador-intentos").innerText = usuarioObj.intentosFallidos;

                    if (usuarioObj.intentosFallidos >= 3) {
                        usuarioObj.bloqueado = true;
                        this.guardarDatos();
                        this.mostrarAlerta("Cuenta bloqueada tras 3 intentos fallidos.");
                    } else {
                        this.mostrarAlerta(`Contraseña incorrecta. Intento ${usuarioObj.intentosFallidos} de 3.`);
                    }
                } else {
                    this.mostrarAlerta("Contraseña incorrecta.");
                }
            }
        });
    }

    iniciarPanelSegunRol() {
        if (this.usuarioActual.rol === "admin") {
            this.mostrarVista("vista-admin");
            this.renderizarPanelAdmin();
        } else {
            document.getElementById("lbl-usuario-activo").innerText = this.usuarioActual.nombreCompleto;
            this.poblarSelectsCuentas();
            this.mostrarVista("vista-panel");
            this.abrirSeccion("seccion-saldo");
        }
    }

    cerrarSesion() {
        this.usuarioActual = null;
        this.mostrarVista("vista-landing");
    }

    abrirSeccion(idSeccion) {
        document.querySelectorAll(".panel-seccion").forEach(s => s.classList.add("oculto"));
        document.getElementById(idSeccion).classList.remove("oculto");

        if (idSeccion === "seccion-saldo") {
            this.actualizarVistaSaldo();
        } else if (idSeccion === "seccion-movimientos") {
            this.renderizarMovimientos();
        } else if (idSeccion === "seccion-perfil") {
            document.getElementById("perfil-nombre").value = this.usuarioActual.nombreCompleto;
            document.getElementById("perfil-email").value = this.usuarioActual.email;
            document.getElementById("perfil-celular").value = this.usuarioActual.celular;
        } else if (idSeccion === "seccion-tarjeta") {
            let tc = this.usuarioActual.cuentas.find(c => c instanceof TarjetaCredito);
            if (tc) document.getElementById("tc-cupo").innerText = `$${tc.cupoDisponible.toLocaleString()}`;
        }
    }

    poblarSelectsCuentas() {
        const selects = ["select-cuenta-consignar", "select-cuenta-retirar", "select-cuenta-movimientos", "trans-origen"];
        selects.forEach(id => {
            const sel = document.getElementById(id);
            if(sel) {
                sel.innerHTML = "";
                this.usuarioActual.cuentas.forEach(c => {
                    let opt = document.createElement("option");
                    opt.value = c.numeroCuenta;
                    opt.text = `${c.constructor.name} (${c.numeroCuenta}) - Saldo: $${c.saldo.toLocaleString()}`;
                    sel.appendChild(opt);
                });
            }
        });
    }

    actualizarVistaSaldo() {
        let texto = "";
        this.usuarioActual.cuentas.forEach(c => {
            texto += `${c.constructor.name} (${c.numeroCuenta}): $${c.saldo.toLocaleString()}<br>`;
        });
        document.getElementById("info-saldo").innerHTML = texto;
    }

    guardarDinero() {
        const numCuenta = document.getElementById("select-cuenta-consignar").value;
        const monto = parseFloat(document.getElementById("monto-consignar").value);
        const cuenta = this.usuarioActual.cuentas.find(c => c.numeroCuenta === numCuenta);

        try {
            cuenta.guardarDinero(monto);
            this.guardarDatos();
            this.mostrarAlerta("Consignación realizada con éxito.");
            document.getElementById("monto-consignar").value = "";
            this.actualizarVistaSaldo();
            this.poblarSelectsCuentas();
        } catch (error) {
            this.mostrarAlerta(error.message);
        }
    }

    retirarDinero() {
        const numCuenta = document.getElementById("select-cuenta-retirar").value;
        const monto = parseFloat(document.getElementById("monto-retirar").value);
        const cuenta = this.usuarioActual.cuentas.find(c => c.numeroCuenta === numCuenta);

        try {
            cuenta.retirarDinero(monto);
            this.guardarDatos();
            this.mostrarAlerta("Retiro realizado con éxito.");
            document.getElementById("monto-retirar").value = "";
            this.actualizarVistaSaldo();
            this.poblarSelectsCuentas();
        } catch (error) {
            this.mostrarAlerta(error.message);
        }
    }

    liquidarInteresesAhorrosManual() {
        let cuentaAhorros = this.usuarioActual.cuentas.find(c => c instanceof CuentaAhorros);
        if (!cuentaAhorros) {
            this.mostrarAlerta("No se encontró cuenta de ahorros.");
            return;
        }
        try {
            let interes = cuentaAhorros.liquidarIntereses();
            this.guardarDatos();
            this.mostrarAlerta(`Intereses liquidados con éxito: $${interes.toFixed(2)}`);
            this.actualizarVistaSaldo();
            this.poblarSelectsCuentas();
        } catch (error) {
            this.mostrarAlerta(error.message);
        }
    }

    renderizarMovimientos() {
        const numCuenta = document.getElementById("select-cuenta-movimientos").value;
        const cuenta = this.usuarioActual.cuentas.find(c => c.numeroCuenta === numCuenta);
        const contenedor = document.getElementById("lista-movimientos");
        contenedor.innerHTML = "";

        if (!cuenta || cuenta.movimientos.length === 0) {
            contenedor.innerHTML = "<p>No hay movimientos registrados.</p>";
            return;
        }

        cuenta.movimientos.forEach(m => {
            let div = document.createElement("div");
            div.style.borderBottom = "1px solid #ddd";
            div.style.padding = "8px 0";
            div.innerHTML = `<strong>${m.fecha}</strong> - ${m.tipo}: $${m.valor.toLocaleString()} (Saldo: $${m.saldoResultante.toLocaleString()})`;
            contenedor.appendChild(div);
        });
    }

    transferirDinero() {
        const origenNum = document.getElementById("trans-origen").value;
        const usuarioDest = document.getElementById("trans-usuario-dest").value.trim();
        const tipoDest = document.getElementById("trans-destino-tipo").value;
        const monto = parseFloat(document.getElementById("monto-transferir").value);

        if (isNaN(monto) || monto <= 0) {
            this.mostrarAlerta("Ingrese un monto válido mayor a cero.");
            return;
        }

        const cuentaOrigen = this.usuarioActual.cuentas.find(c => c.numeroCuenta === origenNum);
        const clienteDestino = this.usuarios.find(u => u.usuario === usuarioDest && u.rol === "cliente");

        if (!clienteDestino) {
            this.mostrarAlerta("El usuario destino no existe o no es un cliente válido.");
            return;
        }

        const cuentaDestino = clienteDestino.cuentas.find(c => {
            if (tipoDest === "ahorros") return c instanceof CuentaAhorros;
            if (tipoDest === "corriente") return c instanceof CuentaCorriente;
            return false;
        });

        if (!cuentaDestino) {
            this.mostrarAlerta("El tipo de cuenta destino no es válido.");
            return;
        }

        if (cuentaOrigen.numeroCuenta === cuentaDestino.numeroCuenta) {
            this.mostrarAlerta("No se permiten transferencias al mismo producto.");
            return;
        }

        try {
            // Operación Atómica Lógica
            cuentaOrigen.retirarDinero(monto);
            try {
                cuentaDestino.guardarDinero(monto);
            } catch (errDest) {
                // Reversión automática en origen si falla el abono
                cuentaOrigen.guardarDinero(monto);
                throw new Error("Falló el abono al destino. Transferencia cancelada y revertida.");
            }

            this.guardarDatos();
            this.mostrarAlerta("Transferencia realizada con éxito.");
            document.getElementById("monto-transferir").value = "";
            document.getElementById("trans-usuario-dest").value = "";
            this.actualizarVistaSaldo();
            this.poblarSelectsCuentas();
        } catch (error) {
            this.mostrarAlerta(error.message);
        }
    }

    comprarTarjetaCredito() {
        const monto = parseFloat(document.getElementById("tc-monto").value);
        const cuotas = parseInt(document.getElementById("tc-cuotas").value);
        let tc = this.usuarioActual.cuentas.find(c => c instanceof TarjetaCredito);

        try {
            let cuotaMensual = tc.comprarACuotas(monto, cuotas);
            this.guardarDatos();
            let resBox = document.getElementById("tc-resultado");
            resBox.classList.remove("oculto");
            resBox.innerHTML = `Compra exitosa.<br>Pago mensual resultante: <strong>$${cuotaMensual.toFixed(2)}</strong>`;
            document.getElementById("tc-cupo").innerText = `$${tc.cupoDisponible.toLocaleString()}`;
        } catch (error) {
            this.mostrarAlerta(error.message);
        }
    }

    actualizarPerfil() {
        this.usuarioActual.nombreCompleto = document.getElementById("perfil-nombre").value.trim();
        this.usuarioActual.email = document.getElementById("perfil-email").value.trim();
        this.usuarioActual.celular = document.getElementById("perfil-celular").value.trim();
        this.guardarDatos();
        this.mostrarAlerta("Perfil actualizado correctamente.");
        document.getElementById("lbl-usuario-activo").innerText = this.usuarioActual.nombreCompleto;
    }

    cambiarPassword() {
        const actual = document.getElementById("pass-actual").value;
        const nueva = document.getElementById("pass-nueva").value;
        const confirmar = document.getElementById("pass-confirmar").value;

        if (this.usuarioActual.contrasena !== actual) {
            this.mostrarAlerta("La contraseña actual es incorrecta.");
            return;
        }
        if (nueva.length < 4) {
            this.mostrarAlerta("La nueva contraseña debe tener al menos 4 caracteres.");
            return;
        }
        if (nueva !== confirmar) {
            this.mostrarAlerta("La nueva contraseña no coincide con la confirmación.");
            return;
        }

        this.usuarioActual.contrasena = nueva;
        this.guardarDatos();
        this.mostrarAlerta("Contraseña cambiada exitosamente.");
        document.getElementById("pass-actual").value = "";
        document.getElementById("pass-nueva").value = "";
        document.getElementById("pass-confirmar").value = "";
    }

    // --- FUNCIONES DE ADMINISTRACIÓN ---
    renderizarPanelAdmin() {
        const contenedor = document.getElementById("admin-lista-usuarios");
        contenedor.innerHTML = "";

        const clientes = this.usuarios.filter(u => u.rol === "cliente");
        if (clientes.length === 0) {
            contenedor.innerHTML = "<p>No hay clientes registrados.</p>";
            return;
        }

        clientes.forEach(cli => {
            let div = document.createElement("div");
            div.style.border = "1px solid #ccc";
            div.style.padding = "10px";
            div.style.marginBottom = "10px";
            div.style.borderRadius = "6px";
            div.innerHTML = `
                <strong>${cli.nombreCompleto}</strong> (${cli.usuario})<br>
                ID: ${cli.identificacion} | Email: ${cli.email} | Celular: ${cli.celular}<br>
                Estado: <span style="color: ${cli.bloqueado ? 'red' : 'green'}; font-weight: bold;">${cli.bloqueado ? 'Bloqueado' : 'Activo'}</span><br>
                <button onclick="app.toggleBloqueoUsuario('${cli.usuario}')" class="btn-blanco" style="padding: 6px; font-size: 0.8rem; margin-top: 5px;">
                    ${cli.bloqueado ? 'Desbloquear Cuenta' : 'Bloquear Cuenta'}
                </button>
            `;
            contenedor.appendChild(div);
        });
    }

    toggleBloqueoUsuario(usuarioId) {
        const cli = this.usuarios.find(u => u.usuario === usuarioId);
        if (cli && cli.rol === "cliente") {
            cli.bloqueado = !cli.bloqueado;
            if (!cli.bloqueado) cli.intentosFallidos = 0;
            this.guardarDatos();
            this.renderizarPanelAdmin();
            this.mostrarAlerta(`Estado del usuario ${cli.usuario} actualizado.`);
        }
    }
}

// Inicializar Aplicación
const app = new BovedaApp();