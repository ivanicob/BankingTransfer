import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransferFormComponent } from './features/transfers/components/transfer-form/transfer-form.component';

const routes: Routes = [
  // 1. Redirect empty path to 'transfer'
  { path: '', redirectTo: 'transfer', pathMatch: 'full' },
  
  // 2. Define the route for your component
  { path: 'transfer', component: TransferFormComponent },
  
  // 3. Wildcard route (optional) for pages not found
  { path: '**', redirectTo: 'transfer' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
