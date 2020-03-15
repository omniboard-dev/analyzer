import { ListrTask } from 'listr';

export const prepareProjectDataTask: ListrTask = {
  title: 'Prepare project data',
  task: (ctx, task) => {
    ctx.projectData = {
      name: ctx.name,
      info: {
        names: ctx.names
      },
      checks: { usesOldApi: true }
    };
  }
};
