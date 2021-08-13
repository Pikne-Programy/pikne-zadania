import {
  ExerciseTreeNode,
  ServerResponseNode,
  Subject,
} from './exercise.utils';
import { ExerciseType } from './exercises';

const desc = 'Test description';

describe('Exercise Utils', () => {
  describe('Subject', () => {
    describe('createSubject', () => {
      it('should return null (is not a Subject)', () => {
        const obj = {
          name: 'Sb1',
          children: 'ex1',
        };
        expect(Subject.createSubject(obj, false)).toBeNull();
      });
      it('should return Exercise tree', () => {
        const obj = {
          name: 'Sb1',
          children: [
            {
              name: 'Ex1',
              children: 'ex1',
            },
          ],
        };
        expect(Subject.createSubject(obj, false)).toBeInstanceOf(
          ExerciseTreeNode
        );
      });
    });

    describe('checkSubjectValidity', () => {
      it('should return false (root element is not a Subject)', () => {
        const obj = {
          name: 'Ex1',
          children: 'ex1',
        };
        expect(Subject.checkSubjectValidity(obj)).toBe(false);
      });

      it('should return true (valid Subject)', () => {
        const obj: ServerResponseNode = {
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
        };
        expect(Subject.checkSubjectValidity(obj)).toBe(true);
      });

      it(`should return true (valid Subject w/ 'done')`, () => {
        const obj = {
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
        };
        expect(Subject.checkSubjectValidity(obj)).toBe(true);
      });

      it(`should return false (wrong 'done' type)`, () => {
        const obj = {
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
        };
        expect(Subject.checkSubjectValidity(obj)).toBe(false);
      });

      it(`should return true (valid Subject w/ 'type' & 'desc')`, () => {
        const obj: ServerResponseNode = {
          name: 'Sb1',
          children: [
            {
              name: 'Cat1',
              children: [
                {
                  name: 'SubCat1',
                  children: [
                    {
                      type: 'EqEx',
                      name: 'Ex1',
                      children: 'ex1',
                      desc,
                    },
                  ],
                },
                {
                  type: 'EqEx',
                  name: 'Ex2',
                  children: 'ex2',
                  desc,
                },
              ],
            },
            {
              type: 'EqEx',
              name: 'Ex3',
              children: 'ex3',
              desc,
            },
          ],
        };
        expect(Subject.checkSubjectValidity(obj, true)).toBe(true);
      });

      it(`should return false (missing type)`, () => {
        const obj = {
          name: 'Sb1',
          children: [
            {
              name: 'Ex1',
              children: 'ex1',
              desc,
            },
          ],
        };
        expect(Subject.checkSubjectValidity(obj, true)).toBe(false);
      });

      it(`should return false (wrong 'type')`, () => {
        const obj = {
          name: 'Sb1',
          children: [
            {
              type: 'Abc',
              name: 'Ex1',
              children: 'ex1',
              desc,
            },
          ],
        };
        expect(Subject.checkSubjectValidity(obj, true)).toBe(false);
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
    const objWithType1 = {
      name: 'Sb1',
      children: [
        {
          type: 'EqEx',
          name: 'Ex1',
          children: 'ex1',
          desc,
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
    const objWithType3 = {
      name: 'Sb1',
      children: [
        {
          name: 'Cat1',
          children: [
            {
              name: 'SubCat1',
              children: [
                {
                  type: 'EqEx',
                  name: 'Ex1',
                  children: 'ex1',
                  desc,
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
  });
});

function expectToBeExerciseTreeNode(
  obj: ExerciseTreeNode,
  value: string,
  childrenSize: number,
  parent: ExerciseTreeNode | null,
  url: string | null = null,
  type?: ExerciseType,
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

  if (type) {
    expect(obj.type).toBe(type);
    expect(obj.description).toBe(desc);
  }

  if (url) {
    expect(obj.url).toBe(url);
    if (childrenSize > 0)
      fail('should be Exercise with no children (wrong test)');
    else expect(obj.children).toHaveSize(0);
  }

  if (done !== undefined && done !== null) expect(obj.done).toBeCloseTo(done);
}
