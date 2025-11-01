import styles from '../styles/CsvHandler.module.css';

const FileSystemDetails = ({ blocks }) =>
{
  if (!blocks) return null;

  const summary = blocks.map((b, i) =>
  {
    const id = b?.blockId ?? i;
    const recs = (b?.records ?? []).map((r) =>
    {
      if (!r) return null;
      return r.row ?? r.data ?? r.fields ?? r.record ?? r;
    });
    return { blockId: id, records: recs };
  });

  return (
    <div className={styles.detailsArea}>
      <h4>Filesystem Blocks Summary</h4>
      <pre>{JSON.stringify(summary, null, 2)}</pre>
    </div>
  );
};

export default FileSystemDetails;