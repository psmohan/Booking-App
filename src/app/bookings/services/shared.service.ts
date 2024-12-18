import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  constructor(private snackbar: MatSnackBar) {}

  snackBar(msg: string, action: string, config: any) {
    this.snackbar.open(msg, action, config);
  }
}
