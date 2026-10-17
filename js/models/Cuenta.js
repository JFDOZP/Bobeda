export class Cuenta {
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

export class CuentaAhorros extends Cuenta {
    constructor(numeroCuenta, saldo = 0) {
        super(numeroCuenta, saldo);
        this.tasaInteresMensual = 0.015; // 1.5% mensual
        this.fechaUltimaLiquidacion = new Date().toISOString();
    }

    // Sobrescribimos retirarDinero para cumplir con el requisito de aplicarlo al retirar
    retirarDinero(monto) {
        if (typeof monto !== "number" || isNaN(monto) || monto <= 0) {
            throw new Error("El monto debe ser un número finito mayor a cero.");
        }
        if (!this.activa) throw new Error("La cuenta se encuentra inactiva.");
        if (monto > this.saldo) throw new Error("Fondos insuficientes.");

        // 1. Calcular intereses acumulados antes del retiro (según el tiempo transcurrido)
        const ahora = new Date();
        const ultima = new Date(this.fechaUltimaLiquidacion);
        const diffAnios = ahora.getFullYear() - ultima.getFullYear();
        const diffMeses = ahora.getMonth() - ultima.getMonth() + (diffAnios * 12);

        if (diffMeses > 0) {
            let interesAcumulado = 0;
            let saldoTemporal = this.saldo;

            for (let i = 0; i < diffMeses; i++) {
                let interesMes = saldoTemporal * this.tasaInteresMensual;
                interesAcumulado += interesMes;
                saldoTemporal += interesMes;
            }

            if (interesAcumulado > 0) {
                this.saldo += interesAcumulado;
                this.agregarMovimiento("Liquidación Intereses (1.5%)", interesAcumulado);
            }
            this.fechaUltimaLiquidacion = ahora.toISOString();
        }

        // 2. Ejecutar el retiro normal después de aplicar los intereses
        this.saldo -= monto;
        this.agregarMovimiento("Retiro (con intereses calculados)", monto);
    }

    liquidarIntereses() {
        const ahora = new Date();
        const ultima = new Date(this.fechaUltimaLiquidacion);
        
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

export class CuentaCorriente extends Cuenta {
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

export class TarjetaCredito extends Cuenta {
    constructor(numeroCuenta, cupoTotal = 1000000) {
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