/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
    PanelComponent,
    PanelItem,
    SpecialPanelItem,
    TextPipe
} from './panel.component';

describe('PanelComponent', () => {
    let component: PanelComponent;
    let fixture: ComponentFixture<WrapperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PanelComponent, WrapperComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(WrapperComponent);
        component = fixture.debugElement.componentInstance.panelComponent;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getItems', () => {
        it('should return provided PanelItems', () => {
            const items: PanelItem[] = [
                ['text1', 'link1', 'icon1'],
                ['text2', 'link2', 'icon2']
            ];
            component.items = items;
            fixture.detectChanges();
            expect(component).toBeTruthy();

            expect(component.getItems()).toEqual(
                items.map(([first, second, third]) => [
                    first,
                    second,
                    third,
                    false,
                    false
                ])
            );
        });

        it('should return provided SpecialPanelItems', () => {
            const items: SpecialPanelItem[] = [
                ['text1', 'link1', 'icon1', true, true],
                ['text2', 'link2', 'icon2', false, true]
            ];
            component.items = items;
            fixture.detectChanges();
            expect(component).toBeTruthy();

            expect(component.getItems()).toEqual(items);
        });

        it('should return empty list when no items or tabs', () => {
            expect(component).toBeTruthy();

            expect(component.getItems()).withContext('No tabs').toEqual([]);

            component.tabs = [];
            fixture.detectChanges();
            expect(component.getItems()).withContext('Empty tabs').toEqual([]);
        });

        it('should return items from current tab', () => {
            const tab1: PanelItem[] = [
                ['text1', 'link1', 'icon1'],
                ['text2', 'link2', 'icon2']
            ];
            const tab2: SpecialPanelItem[] = [
                ['text3', 'link4', 'icon4', true, true],
                ['text4', 'link4', 'icon4', false, true]
            ];
            component.tabs = [
                ['tab1', tab1],
                ['tab2', tab2]
            ];
            component.currentTab = 0;
            fixture.detectChanges();

            expect(component.getItems())
                .withContext('Tab 1')
                .toEqual(
                    tab1.map(([first, second, third]) => [
                        first,
                        second,
                        third,
                        false,
                        false
                    ])
                );

            component.currentTab = 1;
            fixture.detectChanges();
            expect(component.getItems()).withContext('Tab 2').toEqual(tab2);
        });
    });

    describe('getTabs', () => {
        it('should return undefined', () => {
            expect(component).toBeTruthy();

            expect(component.getTabs())
                .withContext('No items and no tabs')
                .toBeUndefined();

            component.tabs = [];
            fixture.detectChanges();
            expect(component.getTabs())
                .withContext('No items and empty tabs')
                .toBeUndefined();

            component.items = [['text1', 'link1', 'icon1']];
            fixture.detectChanges();
            expect(component.getTabs())
                .withContext('Items provided')
                .toBeUndefined();
        });

        it('should return tab names', () => {
            const names = ['Tab 1', 'Tab 2', 'Tab 3'];
            component.tabs = names.map((tab, i) => [
                tab,
                [[`text${i}`, `link${i}`, `icon${i}`]]
            ]);
            fixture.detectChanges();

            expect(component.getTabs()).toEqual(names);
        });
    });

    describe('getCurrentTab', () => {
        const tabLength = 3;

        it('should return first tab index', () => {
            expect(component).toBeTruthy();

            expect(component.getCurrentTab(tabLength))
                .withContext('currentTab undefined')
                .toBe(0);

            component.currentTab = -1;
            fixture.detectChanges();
            expect(component.getCurrentTab(tabLength))
                .withContext('currentTab < 0')
                .toBe(0);

            component.currentTab = tabLength;
            fixture.detectChanges();
            expect(component.getCurrentTab(tabLength))
                .withContext('currentTab >= tabListLength')
                .toBe(0);
        });

        it('should return current tab index', () => {
            for (let i = 0; i < tabLength; i++) {
                component.currentTab = i;
                fixture.detectChanges();

                expect(component.getCurrentTab(tabLength))
                    .withContext(`Index ${i}`)
                    .toBe(i);
            }
        });
    });

    describe('getRouterLink', () => {
        const itemLink = 'item-link';

        it('should return only item link', () => {
            expect(component).toBeTruthy();

            expect(component.getRouterLink(itemLink)).toEqual([itemLink]);
        });

        it('should return main link and item link pair', () => {
            expect(component).toBeTruthy();
            const mainLink = 'main-link';
            component.mainLink = mainLink;
            fixture.detectChanges();

            expect(component.getRouterLink(itemLink)).toEqual([
                mainLink,
                itemLink
            ]);
        });
    });

    describe('getColor', () => {
        it('should return empty string', () => {
            expect(component).toBeTruthy();

            expect(component.getColor()).toBe('');
        });

        it('should return appropriate css class', () => {
            expect(component).toBeTruthy();
            const list = ['primary', 'waRniNg', 'SUCCESS'].map((color) => [
                color,
                `is-${color.toLowerCase()}`
            ]);

            for (const [color, cssClass] of list) {
                component.color = color;
                fixture.detectChanges();

                expect(component.getColor())
                    .withContext(color.toLowerCase())
                    .toBe(cssClass);
            }
        });
    });

    describe('getPipedText', () => {
        //#region Test cases
        const list: [TextPipe | undefined, [string, string][]][] = [
            [
                undefined,
                [
                    ['text1', 'text1'],
                    ['TeXt 2', 'TeXt 2'],
                    ['TEXT#', 'TEXT#']
                ]
            ],
            [
                'uppercase',
                [
                    ['text1', 'TEXT1'],
                    ['TeXt 2', 'TEXT 2'],
                    ['TEXT#', 'TEXT#']
                ]
            ],
            [
                'lowercase',
                [
                    ['text1', 'text1'],
                    ['TeXt 2', 'text 2'],
                    ['TEXT#', 'text#']
                ]
            ],
            [
                'titlecase',
                [
                    ['text1', 'Text1'],
                    ['TeXt 2', 'Text 2'],
                    ['TEXT#', 'Text#'],
                    ['text 4 text5', 'Text 4 Text5']
                ]
            ]
        ];
        //#endregion

        for (const [pipe, texts] of list) {
            it(`should return ${pipe} text`, () => {
                for (const [input, result] of texts) {
                    component.pipe = pipe;
                    fixture.detectChanges();

                    expect(component.getPipedText(input))
                        .withContext(result)
                        .toBe(result);
                }
            });
        }
    });
});

@Component({
    template: `
        <ng-template #prefix>Prefix div</ng-template>
        <ng-template #suffix>Suffix div</ng-template>
        <app-panel [prefix]="prefix" [suffix]="suffix"></app-panel>
    `
})
class WrapperComponent {
    @ViewChild(PanelComponent, { static: true })
        panelComponent!: PanelComponent;
}
