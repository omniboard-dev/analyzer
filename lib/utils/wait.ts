// try to prevent OOM
export async function wait(delay = 500) {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
}
