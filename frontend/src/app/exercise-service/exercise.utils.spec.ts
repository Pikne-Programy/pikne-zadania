import { categorySeparator as catSeparator } from '../exercises/exercises';
import {
  ExerciseTreeNode,
  ServerResponseNode,
  Subject,
} from './exercise.utils';

describe('Exercise Utils', () => {
  describe('Subject', () => {
    describe('createSubjectList', () => {
      let setDoneSpy: jasmine.Spy<any>;
      let getDoneSpy: jasmine.Spy<any>;

      beforeEach(() => {
        setDoneSpy = spyOn(Object.getPrototypeOf(localStorage), 'setItem');
        getDoneSpy = spyOn(Object.getPrototypeOf(localStorage), 'getItem');
      });

      it('should return Subject list (w/ done)', () => {
        const objList: ServerResponseNode[] = [
          {
            name: 'Sb1',
            children: [
              {
                name: 'Ex1',
                children: 'ex1',
                done: 0.14,
              },
              {
                name: 'Ex2',
                children: 'ex2',
                done: 0.5,
              },
              {
                name: 'Ex3',
                children: 'ex3',
                done: null,
              },
            ],
          },
          {
            name: 'Sb2',
            children: [
              {
                name: 'Ex4',
                children: 'ex4',
                done: undefined,
              },
            ],
          },
        ];
        getDoneSpy.and.returnValue('0.9');

        const result = Subject.createSubjectList(objList, true);
        if (!result) fail('should not be null');
        else result.forEach((item) => expect(item).toBeInstanceOf(Subject));

        expect(getDoneSpy).toHaveBeenCalledWith('Sb2/ex4');
        const args: [string, string][] = [
          ['Sb1/ex1', '0.14'],
          ['Sb1/ex2', '0.5'],
          ['Sb1/ex3', 'null'],
        ];
        for (const [key, value] of args)
          expect(setDoneSpy).toHaveBeenCalledWith(key, value);
      });
      it('should return Subject list (w/o done)', () => {
        const objList: ServerResponseNode[] = [
          {
            name: 'Sb1',
            children: [
              {
                name: 'Cat1',
                children: [
                  {
                    name: 'Ex1',
                    children: 'ex1',
                  },
                ],
              },
              {
                name: 'Cat2',
                children: [
                  {
                    name: 'Ex1',
                    children: 'ex1',
                  },
                ],
              },
            ],
          },
          {
            name: 'Sb2',
            children: [
              {
                name: 'Ex1',
                children: 'ex1',
              },
              {
                name: 'Ex2',
                children: 'ex2',
              },
            ],
          },
        ];

        const result = Subject.createSubjectList(objList, false);
        if (!result) fail('should not be null');
        else result.forEach((item) => expect(item).toBeInstanceOf(Subject));

        expect(getDoneSpy).not.toHaveBeenCalled();
        expect(setDoneSpy).not.toHaveBeenCalled();
      });

      it('should return null (wrong data format)', () => {
        const objList = [
          {
            name: 'Sb1',
            children: [
              {
                name: 'Cat1',
                children: [
                  {
                    name: 'Ex1',
                    children: 'ex1',
                  },
                ],
              },
              {
                name: 'Ex2',
                children: 'ex2',
              },
            ],
          },
          {
            name: 'Sb2',
            children: 'ex1',
          },
        ];
        expect(Subject.createSubjectList(objList, false)).toBe(null);
        expect(getDoneSpy).not.toHaveBeenCalled();
        expect(setDoneSpy).not.toHaveBeenCalled();
      });
    });

    describe('checkSubjectListValidity', () => {
      it('should return false (not an array)', () => {
        const obj = {
          name: 'Sb1',
          children: [
            {
              name: 'Ex1',
              children: 'ex1',
            },
          ],
        };
        expect(Subject.checkSubjectListValidity(obj)).toBe(false);
      });

      it('should return true (empty array)', () => {
        expect(Subject.checkSubjectListValidity([])).toBe(true);
      });

      it('should return false (root elements are not Subjects)', () => {
        const objList = [
          {
            name: 'Sb1',
            children: [
              {
                name: 'Ex1',
                children: 'ex1',
              },
            ],
          },
          {
            name: 'Ex2',
            children: 'ex2',
          },
        ];
        expect(Subject.checkSubjectListValidity(objList)).toBe(false);
      });

      it('should return true (valid Subject)', () => {
        const objList: ServerResponseNode[] = [
          {
            name: 'Sb1',
            children: [
              {
                name: 'Ex1',
                children: 'ex1',
              },
              {
                name: 'Ex2',
                children: 'ex2',
              },
            ],
          },
          {
            name: 'Sb2',
            children: [
              {
                name: 'Cat1',
                children: [
                  {
                    name: 'Ex1',
                    children: 'ex1',
                  },
                ],
              },
              {
                name: 'Ex2',
                children: 'ex2',
              },
            ],
          },
          {
            name: 'Sb3',
            children: [
              {
                name: 'Cat1',
                children: [
                  {
                    name: 'SubCat1',
                    children: [
                      {
                        name: 'Ex1',
                        children: 'ex1',
                      },
                    ],
                  },
                  {
                    name: 'Ex2',
                    children: 'ex2',
                  },
                ],
              },
              {
                name: 'Ex3',
                children: 'ex3',
              },
            ],
          },
        ];
        expect(Subject.checkSubjectListValidity(objList)).toBe(true);
      });

      it(`should return true (valid Subject w/ 'done')`, () => {
        const objList = [
          {
            name: 'Sb1',
            children: [
              {
                name: 'Ex1',
                children: 'ex1',
                done: 0.14,
              },
              {
                name: 'Ex2',
                children: 'ex2',
                done: null,
              },
            ],
          },
        ];
        expect(Subject.checkSubjectListValidity(objList)).toBe(true);
      });

      it(`should return false (wrong 'done' type)`, () => {
        const objList = [
          {
            name: 'Sb1',
            children: [
              {
                name: 'Ex1',
                children: 'ex1',
                done: 0.14,
              },
              {
                name: 'Ex2',
                children: 'ex2',
                done: 'good',
              },
            ],
          },
        ];
        expect(Subject.checkSubjectListValidity(objList)).toBe(false);
      });
    });
  });

  describe('ExerciseTreeNode', () => {
    //#region Objects
    const obj1 = {
      name: 'Sb1',
      children: [
        {
          name: 'Ex1',
          children: 'ex1',
        },
      ],
    };
    const obj3 = {
      name: 'Sb1',
      children: [
        {
          name: 'Cat1',
          children: [
            {
              name: 'SubCat1',
              children: [
                {
                  name: 'Ex1',
                  children: 'ex1',
                },
              ],
            },
          ],
        },
      ],
    };
    //#endregion

    describe('createExerciseTree', () => {
      const testMess = 'should create Exercise Tree';

      it(`${testMess} (depth 1)`, () => {
        const subject = ExerciseTreeNode.createExerciseTree(
          false,
          obj1.name,
          obj1.children,
          obj1.name
        );
        expectToBeExerciseTreeNode(subject, 'Sb1', 1, null);
        const exercise = subject.children[0];
        expectToBeExerciseTreeNode(exercise, 'Ex1', 0, subject, 'ex1');
      });

      it(`${testMess} (depth 3)`, () => {
        const subject = ExerciseTreeNode.createExerciseTree(
          false,
          obj3.name,
          obj3.children,
          obj3.name
        );
        expectToBeExerciseTreeNode(subject, 'Sb1', 1, null);
        const category = subject.children[0];
        expectToBeExerciseTreeNode(category, 'Cat1', 1, subject);
        const subCategory = category.children[0];
        expectToBeExerciseTreeNode(subCategory, 'SubCat1', 1, category);
        const exercise = subCategory.children[0];
        expectToBeExerciseTreeNode(exercise, 'Ex1', 0, subCategory, 'ex1');
      });
    });

    describe('getPath', () => {
      const testMess = 'should return path of exercise';

      it(`${testMess} (depth 1)`, () => {
        const subject = ExerciseTreeNode.createExerciseTree(
          false,
          obj1.name,
          obj1.children,
          obj1.name
        );
        const exercise = subject.children[0];
        expect(exercise.getPath()).toBe('ex1');
      });

      it(`${testMess} (depth 3)`, () => {
        const subject = ExerciseTreeNode.createExerciseTree(
          false,
          obj3.name,
          obj3.children,
          obj3.name
        );
        const exercise = subject.children[0].children[0].children[0];
        expect(exercise.getPath()).toBe(
          `Cat1${catSeparator}SubCat1${catSeparator}ex1`
        );
      });
    });
  });
});

function expectToBeExerciseTreeNode(
  obj: ExerciseTreeNode,
  value: string,
  childrenSize: number,
  parent: ExerciseTreeNode | null,
  url: string | null = null,
  done?: number | null
) {
  expect(obj).toBeInstanceOf(ExerciseTreeNode);

  expect(obj.value).toBe(value);

  if (childrenSize > 0) {
    expect(obj.children)
      .withContext(
        `Expected [ ${obj.children
          .map((item) => item.value)
          .join(', ')} ] to have size ${childrenSize}`
      )
      .toHaveSize(childrenSize);
  }

  expect(obj.parent).toBe(parent);

  if (url) {
    expect(obj.url).toBe(url);
    if (childrenSize > 0)
      fail('should be Exercise with no children (wrong test)');
    else expect(obj.children).toHaveSize(0);
  }

  if (done !== undefined && done !== null) expect(obj.done).toBeCloseTo(done);
}
