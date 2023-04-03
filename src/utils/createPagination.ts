import { IPageData, IPageInfo } from '../common/types';

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
    totalHits: totalDocuments,
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

export const createPageData = (arg: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalHits: number;
  nextPage?: number | null;
  prevPage?: number | null;
}): IPageData => {
  const {
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    totalHits,
    nextPage,
    prevPage,
  } = arg;

  const pageData: IPageData = {
    totalPages,
    page,
    totalHits,
  };

  if (hasNextPage && typeof nextPage === 'number') {
    pageData.next = {
      page: nextPage,
    };
  }

  if (hasPrevPage && typeof prevPage === 'number') {
    pageData.previous = {
      page: prevPage,
    };
  }

  return pageData;
};
export default createPageInfo;
