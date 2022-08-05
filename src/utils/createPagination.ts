import { IPageInfo } from "../common/types";

const createPageInfo = ({
  page,
  limit,
  startIndex,
  totalDocuments,
}: {
  page: number;
  limit: number;
  startIndex: number;
  totalDocuments: number;
}): IPageInfo => {
  const pageInfo: IPageInfo = {
    totalPages: Math.ceil(totalDocuments / limit),
    totalProducts: totalDocuments,
  };

  const endIndex: number = page * limit;

  if (page <= pageInfo.totalPages) {
    if (endIndex < totalDocuments) {
      pageInfo.next = {
        page: page + 1,
        limit: totalDocuments - endIndex,
      };
    }
    if (startIndex > 0) {
      pageInfo.previous = {
        page: page - 1,
        limit: startIndex,
      };
    }
  }

  return pageInfo;
};

export { createPageInfo };
