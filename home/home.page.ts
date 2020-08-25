import { Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  messages: any[] = [];
  apiURL: string = 'http://192.168.1.8:3001/';
  termino: string = '';
  
  productos: any[] = [];
  productosFiltrados: any[] = [];
  cargando: boolean = true;

  constructor(
    private barcodeScanner: BarcodeScanner,
    private http: HttpClient,
    public alertController: AlertController
  ) { }

  ngOnInit() {
    this.cargarProductos();
  }

  iniciarBarcodeScanner(productoId, indice, referencia) {
    this.barcodeScanner.scan().then((barcodeData: any) => {
      if (barcodeData.text === '') {
        this.productoNoEditado('No se escaneó barcode');
        return;
      }
      this.http.get(`${this.apiURL}poner-codigo-de-barras?id=${ productoId }&ean13=${ barcodeData.text }`).subscribe(
        (data: any) => {
          // this.messages.push(`Producto ${productoId}, editado con ean13: ${barcodeData.text}`);
          this.productosFiltrados[ indice ].caracteristicas.ean13 = barcodeData.text;
          this.productoEditado(referencia, barcodeData.text);
        },
        (error: any) => {
          // this.messages.push('No se edito ningún producto.');
          this.productoNoEditado('Error en la API');
        },
        () => {
          this.cargando = false;
        }
      );
    }).catch(err => {
      this.productoNoEditado('Error en el barcode');
      // this.messages.push(JSON.stringify(err));
    });
  }

  cargarProductos() {
    this.cargando = true;
    this.http.get(`${this.apiURL}productos-ionic`)
      .subscribe(
        (data: any) => {
          this.productos = data.productos;
        },
        (error: any) => {
          this.messages.push('Error en la petición cargar productos.');
        },
        () => {
          this.cargando = false;
        }
      );
  }

  filtrar() {
    this.productosFiltrados = this.productos.filter(
      (elemento: any) => {
        return  new RegExp(this.termino, 'gi').test(elemento.caracteristicas.referencia) ||
                new RegExp(this.termino, 'gi').test(elemento.caracteristicas.modelo) ||
                new RegExp(this.termino, 'gi').test(elemento.caracteristicas.ean13) ||
                new RegExp(this.termino, 'gi').test(elemento.caracteristicas.ean14) ||
                new RegExp(this.termino, 'gi').test(elemento.nombre) ||
                elemento.cmmf.find(element => new RegExp(this.termino, 'gi').test(element.codigo)) ? true : false;
      }
    );
  }

  async productoEditado(referencia, barcode) {
    const alert = await this.alertController.create({
      header: 'Editado con Éxito',
      message: `Ref: ${referencia}, barcode: ${ barcode }`,
      buttons: ['OK']
    });

    await alert.present();
  }

  async productoNoEditado(mensaje) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['Cancel']
    });

    await alert.present();
  }

}
