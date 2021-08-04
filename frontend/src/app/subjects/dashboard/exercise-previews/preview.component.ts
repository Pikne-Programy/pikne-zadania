import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  Type,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Exercise } from 'src/app/exercises/exercises';
import { EqexPreviewComponent } from './eqex/eqex.component';

export interface PreviewComponentType {
  exercise?: Exercise;
}

@Component({
  selector: 'app-subject-ex-prev',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class SubjectDashboardPreviewComponent
  implements AfterViewInit, OnDestroy
{
  @ViewChildren('exContainer', { read: ViewContainerRef })
  containers!: QueryList<ViewContainerRef>;
  componentRef?: ComponentRef<PreviewComponentType>;
  container$?: Subscription;

  @Input() exercise!: Exercise;
  @Input() shouldTypeset?: boolean;
  @Output() ready = new EventEmitter();
  constructor(private factoryResolver: ComponentFactoryResolver) {}

  ngAfterViewInit() {
    if (this.containers.length > 0) this.addComponent(this.containers.first);

    this.container$ = this.containers.changes.subscribe((container) => {
      this.addComponent(container);
      this.container$?.unsubscribe();
    });
  }

  private addComponent(container: ViewContainerRef) {
    this.componentRef?.destroy();
    switch (this.exercise.type) {
      case 'EqEx':
        this.inflateEqExComponent(container);
        break;
      default:
        this.inflateComponent(null, container);
    }
  }

  ngOnDestroy() {
    this.componentRef?.destroy();
    this.container$?.unsubscribe();
  }

  private inflateComponent<T extends PreviewComponentType>(
    type: Type<T> | null,
    container: ViewContainerRef
  ) {
    container.clear();
    if (type !== null) {
      const factory = this.factoryResolver.resolveComponentFactory(type);
      const component = container.createComponent(factory);
      this.componentRef = component;
      setTimeout(() => {
        component.instance.exercise = this.exercise;
      }, 10);
      return component;
    }
    return null;
  }

  inflateEqExComponent(container: ViewContainerRef) {
    const component = this.inflateComponent(EqexPreviewComponent, container)!;
    if (this.shouldTypeset)
      component.instance.setMath().finally(() => this.ready.emit());
  }
}
