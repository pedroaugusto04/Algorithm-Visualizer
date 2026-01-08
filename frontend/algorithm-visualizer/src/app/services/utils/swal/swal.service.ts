import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SwalService {
  private swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger'
    },
    buttonsStyling: false,
    scrollbarPadding: false,
    heightAuto: false
  });

  confirm(
    message: string,
    confirmButtonText: string = 'Confirmar',
    cancelButtonText: string = 'Cancelar'
  ): Promise<boolean> {
    return this.swalWithBootstrapButtons.fire({
      title: 'Confirmação',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true,
      scrollbarPadding: false,
      heightAuto: false
    }).then(result => result.isConfirmed);
  }


  error(title: string, text: string) {
    return this.swalWithBootstrapButtons.fire({
      title,
      text,
      icon: 'error',
      scrollbarPadding: false,
      heightAuto: false
    });
  }

  errorNoButton(title: string, text: string, timer?: number) {
    return this.swalWithBootstrapButtons.fire({
      title,
      text,
      icon: 'error',
      showConfirmButton: false,
      timer: timer ?? 1500,
      timerProgressBar: true,
      scrollbarPadding: false,
      heightAuto: false
    });
  }

  warningNoButton(title: string, text: string) {
    return this.swalWithBootstrapButtons.fire({
      title,
      text,
      icon: 'warning',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      scrollbarPadding: false,
      heightAuto: false
    });
  }

  successNoButton(title: string, text: string) {
    return this.swalWithBootstrapButtons.fire({
      title,
      text,
      icon: 'success',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      scrollbarPadding: false,
      heightAuto: false
    });
  }
}
